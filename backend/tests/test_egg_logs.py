def test_create_and_list_egg_log(gecko, client):
    res = client.post(f"/geckos/{gecko['id']}/egg-logs", json={"date": "2026-08-01", "egg_count": 2})
    assert res.status_code == 201
    body = res.json()
    assert body["egg_count"] == 2

    res = client.get(f"/geckos/{gecko['id']}/egg-logs")
    assert len(res.json()) == 1


def test_update_egg_log_date_regression(gecko, client):
    created = client.post(f"/geckos/{gecko['id']}/egg-logs", json={"date": "2026-08-01", "egg_count": 2}).json()
    res = client.patch(f"/egg-logs/{created['id']}", json={"date": "2026-08-10", "egg_count": 3})
    assert res.status_code == 200
    body = res.json()
    assert body["date"] == "2026-08-10"
    assert body["egg_count"] == 3


def test_delete_egg_log_soft_deletes(gecko, client):
    created = client.post(f"/geckos/{gecko['id']}/egg-logs", json={"date": "2026-08-01", "egg_count": 2}).json()

    res = client.delete(f"/egg-logs/{created['id']}")
    assert res.status_code == 204
    assert client.get(f"/egg-logs/{created['id']}").status_code == 404
    assert client.get(f"/geckos/{gecko['id']}/egg-logs").json() == []
