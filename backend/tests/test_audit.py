from app.models import AuditLog


def _entries_for(db_session, table_name, record_id):
    return (
        db_session.query(AuditLog)
        .filter(AuditLog.table_name == table_name, AuditLog.record_id == record_id)
        .order_by(AuditLog.changed_at)
        .all()
    )


def test_create_gecko_writes_insert_audit_log(client, db_session):
    gecko = client.post("/geckos", json={"name": "小肥"}).json()

    entries = _entries_for(db_session, "geckos", gecko["id"])
    assert len(entries) == 1
    assert entries[0].action == "insert"
    assert entries[0].diff["name"] == {"old": None, "new": "小肥"}


def test_update_gecko_writes_update_audit_log_with_only_changed_fields(client, db_session):
    gecko = client.post("/geckos", json={"name": "小肥", "morph": "普通"}).json()
    client.patch(f"/geckos/{gecko['id']}", json={"name": "改名了"})

    entries = _entries_for(db_session, "geckos", gecko["id"])
    update_entries = [e for e in entries if e.action == "update"]
    assert len(update_entries) == 1
    diff = update_entries[0].diff
    assert diff["name"] == {"old": "小肥", "new": "改名了"}
    assert "morph" not in diff  # 沒有變動的欄位不應該出現在 diff 裡


def test_soft_delete_is_recorded_as_update_not_delete(client, db_session):
    """見 app/deletion.py 的文件字串：軟刪除是屬性賦值（is_deleted/deleted_at），
    會落在 session.dirty 產生 update 型態的稽核紀錄，而不是 delete。"""
    gecko = client.post("/geckos", json={"name": "小肥"}).json()
    client.delete(f"/geckos/{gecko['id']}")

    entries = _entries_for(db_session, "geckos", gecko["id"])
    actions = [e.action for e in entries]
    assert "delete" not in actions
    delete_related = [e for e in entries if e.action == "update" and "is_deleted" in e.diff]
    assert len(delete_related) == 1
    assert delete_related[0].diff["is_deleted"] == {"old": False, "new": True}


def test_cascade_soft_delete_writes_audit_log_for_child_records(client, db_session):
    gecko = client.post("/geckos", json={"name": "小肥"}).json()
    daily = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 3}
    ).json()

    client.delete(f"/geckos/{gecko['id']}")

    entries = _entries_for(db_session, "daily_logs", daily["id"])
    delete_related = [e for e in entries if e.action == "update" and "is_deleted" in e.diff]
    assert len(delete_related) == 1
