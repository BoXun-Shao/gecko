import uuid

# 這次不實作登入 UI，所有資料都掛在這筆固定的預設 user 底下。
# 見 docs/requirements/2026-08-23-資料庫化與商用架構規劃.md
DEFAULT_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_USER_EMAIL = "owner@local"
