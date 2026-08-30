import uuid


def test_create_and_list_daily_log(gecko, client):
    res = client.post(
        f"/geckos/{gecko['id']}/daily-logs",
        json={"date": "2026-08-01", "status": "fed", "qty": 3, "food": "蟋蟀", "poop": True},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "fed"
    assert body["qty"] == 3
    assert body["poop"] is True

    res = client.get(f"/geckos/{gecko['id']}/daily-logs")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_list_daily_logs_ordered_desc_by_date(gecko, client):
    client.post(f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 1})
    client.post(f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-03", "status": "fed", "qty": 1})
    client.post(f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-02", "status": "fed", "qty": 1})

    res = client.get(f"/geckos/{gecko['id']}/daily-logs")
    dates = [l["date"] for l in res.json()]
    assert dates == ["2026-08-03", "2026-08-02", "2026-08-01"]


def test_daily_log_404_for_missing_gecko(client):
    res = client.post(
        f"/geckos/{uuid.uuid4()}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 1}
    )
    assert res.status_code == 404


def test_duplicate_date_returns_409(gecko, client):
    client.post(f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 3})
    res = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "refused", "qty": 0}
    )
    assert res.status_code == 409


def test_update_daily_log_fields(gecko, client):
    created = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 3}
    ).json()

    res = client.patch(f"/daily-logs/{created['id']}", json={"qty": 5, "status": "partial"})
    assert res.status_code == 200
    body = res.json()
    assert body["qty"] == 5
    assert body["status"] == "partial"
    assert body["date"] == "2026-08-01"


def test_update_daily_log_date_field_regression(gecko, client):
    """Regression test：DailyLogUpdate.date 曾經因為欄位名稱與型別名稱相同，
    被 pydantic 的 forward-ref 解析成 NoneType，導致 PATCH 帶 date 一律 422。
    見 backend/app/schemas.py 的 _Date 註解與對應的 fix commit。
    """
    created = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 3}
    ).json()

    res = client.patch(f"/daily-logs/{created['id']}", json={"date": "2026-08-02"})
    assert res.status_code == 200
    assert res.json()["date"] == "2026-08-02"


def test_update_daily_log_date_into_existing_date_conflicts(gecko, client):
    client.post(f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 1})
    second = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-02", "status": "fed", "qty": 1}
    ).json()

    res = client.patch(f"/daily-logs/{second['id']}", json={"date": "2026-08-01"})
    assert res.status_code == 409


def test_delete_daily_log_soft_deletes(gecko, client):
    created = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 3}
    ).json()

    res = client.delete(f"/daily-logs/{created['id']}")
    assert res.status_code == 204

    assert client.get(f"/daily-logs/{created['id']}").status_code == 404
    assert client.get(f"/geckos/{gecko['id']}/daily-logs").json() == []


def test_delete_then_recreate_same_date_is_allowed(gecko, client):
    """軟刪除後，同一天應該可以重新建立紀錄（unique index 只限制 is_deleted=false 的資料列）。"""
    created = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 3}
    ).json()
    client.delete(f"/daily-logs/{created['id']}")

    res = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "refused", "qty": 0}
    )
    assert res.status_code == 201
