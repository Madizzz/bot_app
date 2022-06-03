defmodule BotApp.Repo do
  use Ecto.Repo,
    otp_app: :bot_app,
    adapter: Ecto.Adapters.Postgres
end
