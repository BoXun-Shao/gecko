import uuid


def test_create_gecko_defaults(client):
    res = client.post("/geckos", json={"name": "小肥"})
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "小肥"
    assert body["gender"] == "unknown"
    assert body["feeding_interval_days"] == 7
    assert body["morph"] is None
    assert body["photo_path"] is None


def test_create_gecko_with_full_fields(client):
    payload = {
        "name": "大寶",
        "morph": "Mack Snow",
        "gender": "male",
        "birth_date": "2024-01-01",
        "acquired_date": "2024-06-01",
        "feeding_interval_days": 3,
        "note": "食欲很好",
        "safe_temp_min": 24.0,
        "safe_temp_max": 30.0,
        "safe_humidity_min": 40.0,
        "safe_humidity_max": 60.0,
    }
    res = client.post("/geckos", json=payload)
    assert res.status_code == 201
    body = res.json()
    for key, value in payload.items():
        assert body[key] == value


def test_list_geckos_returns_only_active(client):
    g1 = client.post("/geckos", json={"name": "甲"}).json()
    client.post("/geckos", json={"name": "乙"}).json()
    client.delete(f"/geckos/{g1['id']}")

    res = client.get("/geckos")
    assert res.status_code == 200
    names = [g["name"] for g in res.json()]
    assert names == ["乙"]


def test_get_gecko(gecko, client):
    res = client.get(f"/geckos/{gecko['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == gecko["id"]


def test_get_gecko_404_for_unknown_id(client):
    res = client.get(f"/geckos/{uuid.uuid4()}")
    assert res.status_code == 404


def test_get_gecko_404_after_soft_delete(gecko, client):
    client.delete(f"/geckos/{gecko['id']}")
    res = client.get(f"/geckos/{gecko['id']}")
    assert res.status_code == 404


def test_update_gecko_partial(gecko, client):
    res = client.patch(f"/geckos/{gecko['id']}", json={"name": "改名了", "feeding_interval_days": 5})
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "改名了"
    assert body["feeding_interval_days"] == 5
    # 沒帶到的欄位應該維持原值
    assert body["gender"] == gecko["gender"]


def test_update_gecko_404_after_soft_delete(gecko, client):
    client.delete(f"/geckos/{gecko['id']}")
    res = client.patch(f"/geckos/{gecko['id']}", json={"name": "x"})
    assert res.status_code == 404


def test_delete_gecko_is_idempotent_soft_delete(gecko, client):
    res = client.delete(f"/geckos/{gecko['id']}")
    assert res.status_code == 204
    # 再刪一次應該 404（已經不是 active 的守宮了）
    res = client.delete(f"/geckos/{gecko['id']}")
    assert res.status_code == 404
