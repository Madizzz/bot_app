defmodule BotAppWeb.PageController do
  use BotAppWeb, :controller

  def index(conn, _params) do
    render(conn, "chat.html")
  end



end
