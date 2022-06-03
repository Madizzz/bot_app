defmodule BotAppWeb.BotController do
  use BotAppWeb, :controller

  def bot(conn, _params) do
    data =  HTTP.get("https://mb.beeline.kz/web/initialize?bot=DANA&channel=web&lang=ru")
    conn
    |> json(%{data: data})
  end

  def css(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/css/chat.min.css?20210827-119")
    conn
    |> put_resp_content_type("text/css")
    |> send_resp(200, body)
  end

  def js(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/chat-min.js?20211214")
    conn
    |> put_resp_content_type("text/javascript")
    |> send_resp(200, body)
  end

  def vendors(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/webfiles/1652780576563/dist/js/vendors.js")
    conn
    |> put_resp_content_type("text/javascript")
    |> send_resp(200, body)
  end

  def anim_0(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/images/dana/anim_0.gif?v=20210827-119")
    conn
    |> put_resp_content_type("image/gif")
    |> send_resp(200, body)
  end

  def anim_1(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/images/dana/anim_1.gif?v=20210827-119")
    conn
    |> put_resp_content_type("image/gif")
    |> send_resp(200, body)
  end

  def anim_2(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/images/dana/anim_2.gif?v=20210827-119")
    conn
    |> put_resp_content_type("image/gif")
    |> send_resp(200, body)
  end

  def anim_3(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/images/dana/anim_3.gif?v=20210827-119")
    conn
    |> put_resp_content_type("image/gif")
    |> send_resp(200, body)
  end

  def anim_4(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/images/dana/anim_4.gif?v=20210827-119")
    conn
    |> put_resp_content_type("image/gif")
    |> send_resp(200, body)
  end

  def sprite(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/images/sprite.png?2021040915")
    conn
    |> put_resp_content_type("image/png")
    |> send_resp(200, body)
  end

  def telegram(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/images/telegram.png")
    conn
    |> put_resp_content_type("image/png")
    |> send_resp(200, body)
  end

  def whatsapp(conn, _params) do
    {:ok, %{body: body}} =  HTTPoison.get("https://beeline.kz/binaries/content/assets/chat-bot/images/whatsapp.png")
    conn
    |> put_resp_content_type("image/png")
    |> send_resp(200, body)
  end


end
