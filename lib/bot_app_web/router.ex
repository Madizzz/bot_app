defmodule BotAppWeb.Router do
  use BotAppWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, {BotAppWeb.LayoutView, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", BotAppWeb do
    pipe_through :browser

    get "/", PageController, :index

    get "/bot", BotController, :bot

    post "/bot", BotController, :bot

  end

  scope "/", BotAppWeb do
    get "/css/chat.css", BotController, :css

    get "/assets/bot.js", BotController, :js

    get "/js/vendors.js", BotController, :vendors

    get "/binaries/content/assets/chat-bot/images/dana/anim_0.gif", BotController, :anim_0

    get "/binaries/content/assets/chat-bot/images/dana/anim_1.gif", BotController, :anim_1

    get "/binaries/content/assets/chat-bot/images/dana/anim_2.gif", BotController, :anim_2

    get "/binaries/content/assets/chat-bot/images/dana/anim_3.gif", BotController, :anim_3

    get "/binaries/content/assets/chat-bot/images/dana/anim_4.gif", BotController, :anim_4

    get "/images/sprite.png", BotController, :sprite

    get "/images/telegram.png", BotController, :telegram

    get "/images/whatsapp.png", BotController, :whatsapp
  end

  # Other scopes may use custom stacks.
  # scope "/api", BotAppWeb do
  #   pipe_through :api
  # end

  # Enables LiveDashboard only for development
  #
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: BotAppWeb.Telemetry
    end
  end

  # Enables the Swoosh mailbox preview in development.
  #
  # Note that preview only shows emails that were sent by the same
  # node running the Phoenix server.
  if Mix.env() == :dev do
    scope "/dev" do
      pipe_through :browser

      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
