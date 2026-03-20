from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    APP_PASSWORD_HASH: str = ""
    DATABASE_URL: str = "sqlite:///./ylc.db"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
