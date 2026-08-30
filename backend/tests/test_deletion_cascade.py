"""驗證 docs/requirements/2026-08-30-軟刪除cascade決策與API開發啟動.md 的決策：
守宮軟刪除時，底下所有子紀錄（含蛻皮照片）都要連帶軟刪除，且都要從各自的
LIST/GET endpoint 消失。
"""
from app.models import DailyLog, EggLog, EnvironmentLog, SheddingLog, SheddingPhoto


def test_delete_gecko_cascades_to_all_child_record_types(gecko, client, db_session):
    daily = client.post(
        f"/geckos/{gecko['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 3}
    ).json()
    shedding = client.post(f"/geckos/{gecko['id']}/shedding-logs", json={"date": "2026-08-01"}).json()
    photo = client.post(
        f"/shedding-logs/{shedding['id']}/photos",
        files=[("files", ("a.jpg", b"fake-jpg-bytes", "image/jpeg"))],
    ).json()[0]
    env = client.post(
        f"/geckos/{gecko['id']}/environment-logs",
        json={"recorded_at": "2026-08-01T08:00:00Z", "temperature": 28.0, "humidity": 50.0},
    ).json()
    egg = client.post(f"/geckos/{gecko['id']}/egg-logs", json={"date": "2026-08-01", "egg_count": 2}).json()

    res = client.delete(f"/geckos/{gecko['id']}")
    assert res.status_code == 204

    # 所有子資源都應該從各自的 LIST/GET 消失
    assert client.get(f"/geckos/{gecko['id']}/daily-logs").status_code == 404  # 父守宮已刪除 → 404
    assert client.get(f"/daily-logs/{daily['id']}").status_code == 404
    assert client.get(f"/shedding-logs/{shedding['id']}").status_code == 404
    assert client.get(f"/environment-logs/{env['id']}").status_code == 404
    assert client.get(f"/egg-logs/{egg['id']}").status_code == 404

    # 直接查資料庫，確認每種子資源（含蛻皮照片）都被標記軟刪除
    assert db_session.get(DailyLog, daily["id"]).is_deleted is True
    assert db_session.get(SheddingLog, shedding["id"]).is_deleted is True
    assert db_session.get(SheddingPhoto, photo["id"]).is_deleted is True
    assert db_session.get(EnvironmentLog, env["id"]).is_deleted is True
    assert db_session.get(EggLog, egg["id"]).is_deleted is True


def test_delete_gecko_does_not_affect_other_geckos_records(client, db_session):
    g1 = client.post("/geckos", json={"name": "甲"}).json()
    g2 = client.post("/geckos", json={"name": "乙"}).json()
    log2 = client.post(
        f"/geckos/{g2['id']}/daily-logs", json={"date": "2026-08-01", "status": "fed", "qty": 1}
    ).json()

    client.delete(f"/geckos/{g1['id']}")

    res = client.get(f"/geckos/{g2['id']}/daily-logs")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert db_session.get(DailyLog, log2["id"]).is_deleted is False
