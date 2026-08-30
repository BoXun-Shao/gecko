def test_create_and_list_environment_log(gecko, client):
    res = client.post(
        f"/geckos/{gecko['id']}/environment-logs",
        json={"recorded_at": "2026-08-01T08:00:00Z", "temperature": 28.5, "humidity": 55.0, "source": "manual"},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["temperature"] == 28.5
    assert body["humidity"] == 55.0
    assert body["source"] == "manual"

    res = client.get(f"/geckos/{gecko['id']}/environment-logs")
    assert len(res.json()) == 1


def test_environment_log_default_source_is_manual(gecko, client):
    res = client.post(
        f"/geckos/{gecko['id']}/environment-logs",
        json={"recorded_at": "2026-08-01T08:00:00Z", "temperature": 28.5, "humidity": 55.0},
    )
    assert res.status_code == 201
    assert res.json()["source"] == "manual"


def test_update_environment_log(gecko, client):
    created = client.post(
        f"/geckos/{gecko['id']}/environment-logs",
        json={"recorded_at": "2026-08-01T08:00:00Z", "temperature": 28.5, "humidity": 55.0},
    ).json()

    res = client.patch(f"/environment-logs/{created['id']}", json={"temperature": 32.0, "source": "sensor"})
    assert res.status_code == 200
    body = res.json()
    assert body["temperature"] == 32.0
    assert body["source"] == "sensor"
    assert body["humidity"] == 55.0


def test_delete_environment_log_soft_deletes(gecko, client):
    created = client.post(
        f"/geckos/{gecko['id']}/environment-logs",
        json={"recorded_at": "2026-08-01T08:00:00Z", "temperature": 28.5, "humidity": 55.0},
    ).json()

    res = client.delete(f"/environment-logs/{created['id']}")
    assert res.status_code == 204
    assert client.get(f"/environment-logs/{created['id']}").status_code == 404
    assert client.get(f"/geckos/{gecko['id']}/environment-logs").json() == []
