console.log("lol")
var Chat = {
    _socket: null,
    _host: "wss://mb.beeline.kz/",
    _http_host: "https://mb.beeline.kz/",
    _lang: null,
    _started: !1,
    _messagesStack: [],
    _visible: !1,
    _TYPE_USER: 1,
    _TYPE_BOT: 2,
    _TYPE_INFO: 3,
    _botName: "DANA",
    _isAutheticated: !1,
    _msisdn: null,
    _loading: !1,
    init: function(t) {
        if ("object" != typeof t || !t.lang) throw new TypeError("Неверный параметр!");
        t.botName && (this._botName = "BOT" == t.botName ? "DANA" : t.botName), t.lang && (t.lang = t.lang.toUpperCase(), this._lang = t.lang), window.$ && $.support && ($.support.cors = !0), t.host && (this._host = t.host), t.http_host && (this._http_host = t.http_host), Character.init(t), this.loadState(), this._started && !this._visible && this.openSocket()
    },
    openSocket: function(t) {
        if (this._socket && this._socket.readyState == this._socket.OPEN) return !0;
        this._socket = new WebSocket(this._host + "chat"), this._socket.addEventListener("open", function(e) {
            console.info("Connected!"), "function" == typeof t && t()
        }), this._socket.addEventListener("message", this.onMessage), this._socket.addEventListener("close", function(t) {
            console.info("Connection closed!"), Chat._started && Chat._visible && setTimeout(function() {
                Chat.openSocket()
            }, 3e3)
        })
    },
    startConnection: function(t, e, n, i, s, a) {
        if ($("#input-message").focus(), $("#input-message").prop("disabled", !1), this._started) return this._socket || this.openSocket(), !0;
        this._started = !0;
        const r = this._lang ? this._lang.toLowerCase() : "";
        var o = this._http_host + "web/initialize?bot=" + this._botName + "&channel=web&lang=" + r,
            u = {
                action: "initialize",
                lang: r,
                channel: "web"
            };
        e && i ? (u.schemaId = e, u.stepId = n, u.buttonId = i, o += "&schemaId=" + e + "&buttonId=" + i) : t ? (u.question = t, o += "&question=" + t) : !0 === s && (o += "&greet=false"), this.doRequest(o, {
            dataType: "json",
            callback: function(t) {
                t.success ? (Chat._socket || Chat.openSocket(), t.responses && Chat.appendMachineMessage(t.responses), "function" == typeof a && a(t)) : Chat.appendError("Ошибка при запросе! Пожалуйста попробуйте позже.")
            }
        })
    },
    doRequest: function(t, e) {
        "object" != typeof e && (e = {}), $.ajax({
            url: t,
            type: e.type ? e.type : "get",
            dataType: e.dataType ? e.dataType : "html",
            data: e.data ? e.data : null,
            xhrFields: {
                withCredentials: !0
            },
            contentType: e.contentType ? e.contentType : null,
            beforeSend: function(t) {
                "function" == typeof e.beforeSend && e.beforeSend(t)
            },
            crossDomain: !0,
            success: function(t) {
                "function" == typeof e.callback && e.callback(t)
            },
            error: function(t) {
                "function" == typeof e.error && e.error(t)
            },
            complete: function(t) {
                "function" == typeof e.complete && e.complete(t)
            }
        })
    },
    onMessage: function(t) {
        var e = JSON.parse(t.data);
        if (e.responses && (Chat._visible || Chat.open(), Chat.appendMachineMessage(e.responses)), "DIALOG_NOT_FOUND" == e.error || "SESSION_EXPIRED" == e.error) return Chat._started = !1, void(e.question ? Chat.startConnection(e.question) : Chat.startConnection(null, e.schemaId, e.stepId, e.buttonId));
        "checkSmsCode" == e.step && (e.success ? ($(".chat-auth-block").hide(), Chat.startDialog(), e.account && Chat.showAuthStatusBlock(e.account)) : e.message && $("#accountErrorMsg").text(e.message), "AUTH_ATTEMPTS_EXPIRED" === e.status && setTimeout(function() {
            Chat.showIntroPage()
        }, 1e3)), Chat.saveState()
    },
    sendData: function(t) {
        if (!this._socket) return console.error("socket not opened yet!"), this.openSocket(function() {
            Chat.sendData(t)
        }), !1;
        this._socket.readyState != this._socket.CONNECTING ? this._socket.readyState == this._socket.OPEN ? this._socket.send(JSON.stringify(t)) : (console.error("socket is closed!"), this.openSocket(function() {
            Chat.sendData(t)
        })) : setTimeout(function() {
            Chat.sendData(t)
        }, 500)
    },
    sendMessage: function() {
        this.sendMsg($("#input-message").val() + ""), $("#input-message").val(""), $(window).trigger("resize")
    },
    sendMsg: function(t) {
        "" != (t = $.trim(t)) && (this.appendUsersMessage(t), this.sendData({
            question: t,
            action: "question"
        }), $(window).trigger("resize"), this.hidePredictList())
    },
    buttonClick: function(t) {
        t = $(t);
        var e = $.trim(t.text() + "");
        "" != e && (t.attr("href") || Chat.appendUsersMessage(e), Chat.sendData({
            action: "buttonClick",
            schemaId: t.attr("sch-id"),
            stepId: t.attr("step-id"),
            buttonId: t.attr("btn-id")
        }), $(window).trigger("resize"))
    },
    appendMachineMessage: function(t) {
        var e, n;
        $(".typingBubble").remove();
        try {
            for (var i in t) {
                var s = t[i];
                e = "", n = "", Chat._isAutheticated && !1 === s.is_authorized && (Chat._isAutheticated = !1, $("#chatUserPanel").hide()), s.ctn && "yes" == s.authorized && Chat.showAuthStatusBlock(s.ctn), s.buttons && (e = '<ul class="chat-response-options">', s.buttons.forEach(function(t) {
                    t.url ? e += '<li class="userlink"><a href="' + t.url + '" sch-id="' + t.schemaId + '" step-id="' + t.stepId + '" btn-id="' + t.buttonId + '" ' + (t.targetBlank ? 'target="_blank"' : "") + ">" + t.name + "</a></li>" : e += '<li class="userlink" sch-id="' + t.schemaId + '" step-id="' + t.stepId + '" btn-id="' + t.buttonId + '" onclick="Chat.buttonClick(this)">' + t.name + "</li>"
                }), e += "</ul>"), s.file && (n = '<div class="chat-attached-file"><a href="' + s.file.url + '" target="_blank">' + s.file.name + "</a></div>"), s.response = this.renderMessage(s.response), this.appendBotMessage(s.response + n + e)
            }
            this.saveState()
        } catch (t) {
            console.error(t)
        }
    },
    appendIframe: function(t) {
        this.append('<div class="answerBubble"><div class="message iframe-msg"><div class="chatbot-iframe-msg-info">' + t.question + '</div><iframe src="' + t.iframe + '"></iframe></div></div>'), this.addMessageToStack(t.question, this._TYPE_BOT, t.iframe)
    },
    appendUsersMessage: function(t) {
        var e = document.createElement("div");
        e.classList.add("userBubble");
        var n = document.createElement("div");
        n.classList.add("message"), n.innerText = t, e.appendChild(n), this.addMessageToStack(t, this._TYPE_USER), this.append(e)
    },
    appendBotMessage: function(t) {
        this.append('<div class="answerBubble"><div class="message">' + t + "</div></div>"), this.addMessageToStack(t, this._TYPE_BOT)
    },
    appendInfo: function(t) {
        this.addMessageToStack(t, this._TYPE_INFO), this.append('<div class="infoBubble"><div class="message">' + t + "</div></div>")
    },
    appendError: function(t) {
        Chat.append('<div class="errorBubble"><div class="message">' + t + "</div></div>")
    },
    append: function(t) {
        $(".messageBox").append(t), this.scrollDown()
    },
    scrollDown: function() {
        $(".messageBox")[0].scrollTop = $(".messageBox")[0].scrollHeight
    },
    removeIllegalChars: function(t) {
        return t = t.toLowerCase(), $.isNumeric(t.replace(new RegExp(" ", "g"), "")) && (t = t.replace(new RegExp(" ", "g"), "")), t
    },
    getCookie: function(t) {
        var e = document.cookie.match(new RegExp("(?:^|; )" + t.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
        return e ? decodeURIComponent(e[1]) : void 0
    },
    setCookie: function(t, e, n) {
        var i = (n = n || {}).expires;
        if ("number" == typeof i && i) {
            var s = new Date;
            s.setTime(s.getTime() + 1e3 * i), i = n.expires = s
        }
        i && i.toUTCString && (n.expires = i.toUTCString());
        var a = t + "=" + (e = encodeURIComponent(e));
        for (var r in n) {
            a += "; " + r, a += "=" + n[r]
        }
        document.cookie = a
    },
    renderMessage: function(t) {
        return t
    },
    addMessageToStack: function(t, e, n) {
        var i = {
            m: t,
            t: e
        };
        n && (i.ifrm = n), this._messagesStack.push(i), this._messagesStack = this._messagesStack.splice(-10)
    },
    saveState: function() {
        if (!JSON) return !1;
        var t = {
            _msisdn: this._msisdn,
            _isAutheticated: this._isAutheticated,
            _started: this._started,
            _visible: this._visible,
            _lang: this._lang
        };
        if (this._authorizeByToken && (t._authorizeByToken = this._authorizeByToken), this.setCookie("_chat", JSON.stringify(t), {
                path: "/"
            }), "undefined" == typeof Storage) return !1;
        localStorage.chatMessages = JSON.stringify(this._messagesStack)
    },
    loadState: function() {
        var t = this.getCookie("_chat");
        if (!t) return !1;
        for (var e in t = JSON.parse(t)) this[e] = t[e];
        this.loadMessagesFromStorage(), this._visible && this.open(), this._isAutheticated && this._msisdn && this.showAuthStatusBlock(this._msisdn)
    },
    loadMessagesFromStorage: function() {
        if ("undefined" == typeof Storage) return !1;
        var t = localStorage.getItem("chatMessages");
        if (!t) return !1;
        t = JSON.parse(t);
        for (var e = 0; e < t.length; e++) {
            var n = t[e];
            n.t == this._TYPE_INFO ? this.appendInfo(n.m) : n.t == this._TYPE_USER ? this.appendUsersMessage(n.m) : n.t == this._TYPE_BOT && this.appendBotMessage(n.m)
        }
        setTimeout(function() {
            Chat.scrollDown(), $(window).trigger("resize")
        }, 100)
    },
    startDialog: function() {
        this._msisdn && this.showAuthStatusBlock(this._msisdn), $(".chatBox").removeClass("intro"), Chat.startConnection(), this.saveState()
    },
    open: function() {
        Character.setDefault(), $(".chatBox").show(), $(".chatBox").css("display", "block"), $("#chat-open-button").hide(), Chat._visible = !0, this._authorizeByToken ? this._started ? (this.openSocket(), Chat.authorizeByToken(!0)) : Chat.startConnection(null, null, null, null, !0, function() {
            Chat.authorizeByToken(!0)
        }) : this._started ? Chat.startConnection() : ($(".chatBox").addClass("intro"), Chat.detectMsisdn())
    },
    close: function() {
        $(".chatBox").hide(), $("#chat-open-button").show(), Chat._dialogEnded = !0, Chat._visible = !1
    },
    loginSubmit: function() {
        var t = $(".chatBox #msisdn").val().replace(/[^\d]+/g, ""),
            e = $(".chatBox #msisdnPass").val();
        $("#accountErrorMsg").text(""), 0 !== t.indexOf("1") && 0 !== t.indexOf("0") ? 11 == t.length && e.length >= 4 ? this.checkPass() : 11 != t.length || "" != e || this.sendSMS() : this.authorizeWithLogin(t)
    },
    authorizeWithLogin(t, e) {
        var n = {
            bot: this._botName,
            login: t,
            channel: "web",
            lang: this._lang,
            step: e ? "authByLogin" : "checkLogin"
        };
        !0 !== this.__web_auth && (this.__web_auth = !0, this.doRequest(this._http_host + "web/auth", {
            data: n,
            dataType: "json",
            callback: function(t) {
                t.success ? (Chat.openSocket(), $(".chatBox #accountInfo").html(t.customer.name + "<br />" + t.customer.address), $(".chatBox .account-confirm-block").show(), $(".chatBox #msisdn, .chatBox .auth-send-buttons").hide(), t.account && ($(".chat-auth-block").hide(), Chat.startDialog(), Chat.showAuthStatusBlock(t.account))) : "KZ" == Chat._lang ? $("#accountErrorMsg").text("Логин табылмады!") : $("#accountErrorMsg").text("Логин не найден!")
            },
            error: function() {
                "KZ" == Chat._lang ? $("#accountErrorMsg").text("Қате орын алды!") : $("#accountErrorMsg").text("Произошла ошибка!")
            },
            complete: function() {
                Chat.__web_auth = !1
            }
        }))
    },
    authorizeWithLoginConfirmed() {
        var t = $(".chatBox #msisdn").val().replace(/[^\d]+/g, "");
        this.authorizeWithLogin(t, !0)
    },
    sendSMS: function() {
        var t = $(".msisdnField").val().replace(/(\+|\(|\)|-)/g, "");
        t.length > 10 && (t = t.substr(t.length - 10)), this._authNumber = t;
        var e = {
            bot: this._botName,
            ctn: t,
            channel: "web",
            lang: this._lang,
            step: "requestNumber"
        };
        $("#accountErrorMsg").text(""), !0 !== this.__web_auth && (this.__web_auth = !0, this.doRequest(this._http_host + "web/auth", {
            data: e,
            dataType: "json",
            callback: function(t) {
                t.success ? (Chat.openSocket(), $(".chatBox .code-block").show(), $(".chatBox #msisdnPass").focus(), $(".chatBox #msisdn").hide()) : t.message && $("#accountErrorMsg").text(t.message)
            },
            error: function() {
                "KZ" == Chat._lang ? $("#accountErrorMsg").text("Қате орын алды!") : $("#accountErrorMsg").text("Произошла ошибка!")
            },
            complete: function() {
                Chat.__web_auth = !1
            }
        }))
    },
    checkPass: function() {
        var t = this._authNumber,
            e = $("#msisdnPass").val(),
            n = function() {
                Chat.sendData({
                    action: "checkAuthCode",
                    bot: Chat._botName,
                    ctn: t,
                    smsCode: e,
                    channel: "web",
                    lang: Chat._lang,
                    step: "checkSmsCode"
                })
            };
        this._socket ? n() : this.openSocket(n)
    },
    logout: function() {
        return new Promise(function(t, e) {
            Chat._msisdn ? Chat.doRequest(Chat._http_host + "web/logout", {
                method: "GET",
                dataType: "json",
                callback: function(e) {
                    if (t(), e.success) {
                        $("#chatUserPanel").hide();
                        var n = "Вы успешно разлогинились!";
                        "KZ" == Chat._lang && (n = "Сіз жүйеден сәтті шықтыңыз!"), Chat.append('<div class="infoBubble"><div class="message">' + n + "</div></div>"), Chat.showIntroPage(), Chat._msisdn = null, Chat._messagesStack = [], Chat._socket = null
                    }
                    Chat.saveState()
                },
                error: function() {
                    e()
                }
            }) : t()
        })
    },
    showAuthStatusBlock: function(t) {
        if (t) {
            if (this._isAutheticated = !0, this._msisdn = t, 0 === t.indexOf("0") || 0 === t.indexOf("1")) var e = t.replace(/(\d{3})(\d{7})/, "$1 $2");
            else e = (e = "7" + t).replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, "+$1 $2 $3 $4 $5");
            $("#chatUserPanel span").text(e), $("#chatUserPanel").show()
        }
    },
    setLoading: function(t) {
        if (this._loading = !1 !== t, $(".chat-bot-loading").remove(), $("#input-message").prop("disabled", !1), 0 != this._loading) {
            $("#input-message").prop("disabled", !0);
            var e = "KZ" == this._lang ? "Күте тұрыңыз" : "Подождите пожалуйста";
            this.append('<div class="chat-bot-loading"><div class="chat-bot-loading-message">' + e + '</div><div class="chat-bot-loading-icon"></div></div>')
        }
    },
    showIntroPage: function() {
        $(".chat-auth-block").show(), $(".chatBox").addClass("intro"), $("#msisdn").show(), $("#msisdn").val(""), $(".chatBox .code-block").hide(), $("#msisdnPass").val(""), $(".chatBox .account-confirm-block").hide(), $(".chatBox #msisdn, .chatBox .auth-send-buttons").show(), $("#accountErrorMsg").text(""), $(".chatBox .messages-block .messageBox").html(""), this._started = !1
    },
    setNumberFromHE: function(t) {
        (t += "").length > 10 && (t = t.substr(t.length - 10));
        var e = t;
        10 == e.length && (e = t.replace(/^(\d\d\d)(\d\d\d)(\d\d)(\d\d)$/g, "+7($1)$2-$3-$4")), Chat._msisdn = t, Chat.setCookie("_chatUserNumber", t, {
            domain: ".beeline.kz"
        }), $(".chatBox #msisdn").val(e)
    },
    detectMsisdn: function() {
        if (this._msisdn) return;
        let t = document.createElement("img");
        t.src = "http://beeline.kz/restservices/header/enrichment/my-beeline-number", t.onload = function() {
            Chat.doRequest("https://beeline.kz/restservices/header/enrichment/my-number", {
                dataType: "json",
                callback: function(t) {
                    Chat.setNumberFromHE(t.account)
                }
            })
        }, t.onerror = function() {}, document.getElementsByTagName("body")[0].appendChild(t)
    },
    authByToken: function() {
        return new Promise(function(t, e) {
            Chat._authorizeByToken = !0, Chat.saveState(), t()
        })
    },
    authorizeByToken: function(t) {
        Chat._authorizeByToken && Chat._started && (Chat.doRequest("/restservices/telco/auth/session", {
            method: "GET",
            dataType: "json",
            callback: function(e) {
                if (e.username) {
                    if (Chat._msisdn && Chat._msisdn != e.username) return;
                    Chat.doRequest(Chat._http_host + "web/authorize_by_token", {
                        type: "POST",
                        dataType: "json",
                        data: JSON.stringify(e),
                        contentType: "application/json; charset=utf-8",
                        callback: function(e) {
                            e.success && e.account && ($(".chat-auth-block").hide(), Chat.showAuthStatusBlock(e.account), t && (Chat.startDialog(), Chat.sendData({
                                action: "greeting"
                            })), Chat.saveState())
                        }
                    })
                }
                resolve()
            },
            error: function(t) {
                reject(t)
            }
        }), Chat._authorizeByToken = !1)
    },
    getPredict: function(t) {
        if (!(t = $.trim(t + "")) || t.length <= 2) return this.hidePredictList(), !1;
        "" != $("#input-message").val() && this.doRequest(this._http_host + "web/predict", {
            type: "POST",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                botCode: this._botName,
                lang: this._lang.toLowerCase(),
                query: t
            }),
            callback: function(t) {
                "" != $("#input-message").val() && Chat.renderPrediction(t.results)
            }
        })
    },
    renderPrediction: function(t) {
        if ($("#chatPredictList").hide(), 0 != t.length) {
            var e, n, i = "";
            for (var s in t) t[s].responseId ? (e = "respid", n = t[s].responseId) : (e = "schid", n = t[s].schemaId), i += "<li " + e + '="' + n + '" onclick="Chat.predictionClick($(this))">' + t[s].title + "</li>";
            $("#chatPredictList").html(i).show(), this.predictionListShown = !0
        }
    },
    hidePredictList: function() {
        $("#chatPredictList").hide(), this.predictionListShown = !1
    },
    predictListControl: function(t) {
        if (-1 == ["Enter", "ArrowUp", "ArrowDown"].indexOf(t) || !this.predictionListShown) return !0;
        var e = $("#chatPredictList li.selected");
        if ("Enter" == t) {
            if (0 == e.length) return !0;
            Chat.predictionClick(e), $("#input-message").val("")
        } else "ArrowUp" == t ? 0 == e.length ? $("#chatPredictList li:last-child").addClass("selected") : (e.removeClass("selected"), e.prev().addClass("selected")) : "ArrowDown" == t && (0 == e.length ? $("#chatPredictList li:first").addClass("selected") : (e.removeClass("selected"), e.next().addClass("selected")));
        return !1
    },
    predictionClick: function(t) {
        var e = {
            action: "getResponseById"
        };
        t.attr("respid") ? e.responseId = t.attr("respid") : e.schemaId = t.attr("schid"), this.sendData(e), this.appendUsersMessage(t.text()), $(window).trigger("resize"), this.hidePredictList(), $("#input-message").val("")
    }
},
Character = {
    _default: "anim_0.gif",
    _host: "/",
    _path: "/binaries/content/assets/chat-bot/images/dana/",
    _moves: ["anim_1.gif", "anim_2.gif", "anim_3.gif", "anim_4.gif"],
    _lastMoveIndex: null,
    _firstOpen: !0,
    _version: "20210827-119",
    _styleSheetFile: "/binaries/content/assets/chat-bot/css/chat.min.css",
    _actions: {
        eye: "anim_5.gif",
        smile: "anim_6.gif",
        think: "anim_7.gif",
        look_down: "anim_8.gif",
        no: "anim_9.gif"
    },
    init: function(t) {
        "localhost:8000" == location.host ? this._path = "./images/dana/" : ["mb.beeline.kz", "mb-dev.beeline.kz", "mb-test.beeline.kz", "localhost:9023"].indexOf(location.host) >= 0 && (this._styleSheetFile = "/web/static/css/chat.min.css", this._path = "/web/static/images/dana/"), this.addOpenButton(), this.embedChat(), this.bindListeners(), setTimeout(function() {
            Character.startAnimation()
        }, 1e3)
    },
    addStylesheet: function() {
        location.host.indexOf("localhost") >= 0 && (this._styleSheetFile = "/css/chat.css"), ["mb.beeline.kz", "mb-dev.beeline.kz", "mb-test.beeline.kz", "localhost:9023"].indexOf(location.host) >= 0 && (this._styleSheetFile = "/web/static/css/chat.min.css", this._path = "/web/static/images/dana/"), $("head").append('<link rel="stylesheet" media="all" href="' + this._styleSheetFile + "?" + this._version + '" />')
    },
    startAnimation: function() {
        var t = this;
        this._inteval = setInterval(function() {
            if (t._animating || !Chat._visible) return !1;
            t.move()
        }, 3e4)
    },
    move: function() {
        var t = this.getMoveIndex();
        if (!this._moves[t]) return !1;
        var e = this._path + this._moves[t];
        this.setAnimation(e)
    },
    action: function(t) {
        if (!this._actions[t]) return !1;
        if (this._animating) return setTimeout(function() {
            Character.action(t)
        }, 1e3), !1;
        var e = this._path + this._actions[t];
        this.setAnimation(e)
    },
    setAnimation: function(t) {
        $(".character-img").attr("src", t + "?v=" + this._version), this._animating = !0, setTimeout(function() {
            Character.setDefault(), Character._animating = !1
        }, 4e3)
    },
    getMoveIndex: function() {
        var t = Math.round(Math.random() * this._moves.length);
        return t == this._lastMoveIndex ? this.getMoveIndex() : (this._lastMoveIndex = t, t)
    },
    setDefault: function() {
        $(".character-img").attr("src", this._path + this._default + "?v=" + this._version)
    },
    addOpenButton: function() {
        var t = "KZ" == Chat._lang ? "Виртуалды кеңесші" : "Виртуальный консультант";
        $("body").append('<div id="chat-open-button" class="beeline">\t\t\t<div class="chat-consultant">' + t + "</div>\t\t</div>")
    },
    embedChat: function() {
        var t = "Введите Ваш вопрос",
            e = "Виртуальный консультант",
            n = "Получите персонализированные ответы на свои вопросы на сайте или в мессенджере",
            i = "Написать в телеграм",
            s = "Написать в facebook",
            a = "Написать в whatsapp",
            r = 'Продолжить <a href="#" class="start-dialog">без авторизации</a>',
            o = "Выход",
            u = "Номер телефона или логин",
            l = "Подтверждаете?",
            h = "Введите код",
            c = "На Ваш номер отправлен СМС с кодом",
            d = "Отправить",
            p = "Да",
            f = "Нет";
        "KZ" == Chat._lang && (t = "Сұрағыңызды енгізіңіз", e = "Виртуальный консультант", n = "Сұрағыңызға жекешелендірілген жауапты сайтта немесе мессенджерде ала аласыз", "Telegram-да", "Facebook-та", "XXXX нөміріне SMS жіберу (тегін)", r = '<a href="#" class="start-dialog">Авторизациясыз жалғастыру</a>', i = "Telegram-да жазу", s = "Facebook-та жазу", a = "Whatsapp-та жазу", "XXXX нөміріне SMS жіберіп (тегін)", o = "Шығу", u = "Нөміріңізді/логиніңізді енгізіңіз", l = "Растайсыз ба?", h = "Кодты енгізіңіз", c = "Нөміріңізге коды бар SMS жіберілді", d = "Жіберу", p = "Да", f = "Нет"), $("body").append('<div class="chatBox">                <div class="ui-icon ui-icon-closethick" id="close"></div>                <div id="chatUserPanel"><i></i> <span class="chat-user-number"></span> <a href="#" title="' + o + '"></a></div>                <div class="chat-box-intro-links">                <h3>' + e + '</h3>                 <p class="int-text">' + n + '</p>                 <ul>                    <li class="chat-auth-block int-text">                        <input id="msisdn" class="chatbot-input-field msisdnField" placeholder="' + u + '" autocomplete="off" /><br />                        <div class="code-block" style="display:none">                            <input id="msisdnPass" class="chatbot-input-field msisdnPass" type="password" placeholder="' + h + '" autocomplete="off" />                             <span class="chat-bot-small-text">' + c + '</span>                        </div>                        <div id="accountErrorMsg" class="chat-bot-small-text chat-bot-error-text"></div>                        <div class="account-confirm-block" style="display:none">                            <div id="accountInfo"></div>                            <span>' + l + '</span>                            <div class="auth-confirm-buttons">                                 <input type="button" value="' + p + '" onclick="Chat.authorizeWithLoginConfirmed()" class="chatbot-btn" />                                <input type="button" value="' + f + '" onclick="Chat.showIntroPage()" class="chatbot-btn chatbot-btn-default" />                            </div>                         </div>                        <div class="auth-send-buttons"><input type="button" value="' + d + '" onclick="Chat.loginSubmit()" class="chatbot-btn" /></div>                         <div class="int-text continue-without-auth">' + r + '<div>                    </li>                    <li class="bot-links">                    <a href="https://t.me/BeelineDanaBot" target="_blank" class="telegram-link" title="' + i + '"><i class="telegram-bot-link"></i> <span class="int-text">' + i + '</span></a>                    <a href="https://wa.me/77713330055" target="_blank" title="' + a + '"><i class="whatsapp-bot-link"></i> <span class="int-text">' + a + '</span></a>                    \x3c!--a href="https://www.facebook.com/Beeline.Kazakhstan/app/190322544333196/?ref=page_internal" target="_blank" title="' + s + '"><i class="facebook-bot-link"></i> <span class="int-text">' + s + '</span></a--\x3e                    </li>                 </ul>                </div>                <div class="character-block"><img class="character-img" src="">\t\t\t</div>                <div class="dialog-block">                    <div class="messages-block">                        <div class="nano">                            <div class="messageBox nano-content"></div>                        </div>                    </div>                    <div class="request-form">                        <ul id="chatPredictList" class="chat-prediction-block" style="display:none"></ul>                        <input name="input-message" id="input-message" type="text" placeholder="' + t + '" maxlength="100" disabled />                        <input type="button" class="send-button" value=" " />                    </div>                </div>            </div>'), "undefined" != typeof IMask && (this.numberMask = new IMask(document.getElementById("msisdn"), {
            mask: [{
                mask: "\\000 0000000",
                startsWith: "0"
            }, {
                mask: "100 0000000",
                startsWith: "1"
            }, {
                mask: "+{7}(700)000-00-00"
            }],
            dispatch: function(t, e) {
                var n = (e.value + t).replace(/\D/g, "");
                return e.compiledMasks.find(function(t) {
                    return !t.startsWith || 0 === n.indexOf(t.startsWith)
                })
            }
        })), $("#msisdn").change(function(t) {
            $("#msisdnPass").val("")
        })
    },
    bindListeners: function() {
        var t;
        $("#chatUserPanel a").click(function() {
            return Chat.logout(), !1
        }), $("#chat-open-button").click(function() {
            return Chat.open(), Chat.saveState(), !1
        }), $("#close").click(function() {
            return Chat.close(), Chat.saveState(), !1
        }), $("#input-message").keypress(function(t) {
            13 == t.which && Chat.sendMessage()
        }), $(".request-form .send-button").click(function() {
            if (Chat._loading) return !1;
            Chat.sendMessage()
        }), $(".chatBox .start-dialog").click(function() {
            return $(".chat-auth-block").hide(), Chat.startDialog(), !1
        }), $("#msisdn").keypress(function(t) {
            13 == t.which && Chat.loginSubmit()
        }), $(".chatBox .enterNumber").click(function() {}), $("#msisdnPass").keypress(function(t) {
            13 == t.which && Chat.checkPass()
        });
        var e = function(e) {
            clearTimeout(t), t = setTimeout(function() {
                Chat.getPredict(e)
            }, 750)
        };
        if ($("#input-message").on("input", function(t) {
                e(t.currentTarget.value)
            }), $("#input-message").keyup(function(t) {
                "Backspace" == t.key && ("" == this.value ? Chat.hidePredictList() : e(t.currentTarget.value))
            }), $("#input-message").keydown(function(t) {
                return Chat.predictListControl(t.key)
            }), $().nanoScroller) $(".chatBox .nano").nanoScroller({
            alwaysVisible: !0
        }), $(".chatBox .nano-content").css("right", 0);
        else {
            var n = $(".dialog-block .messageBox");
            n.removeClass("nano-content"), n.css({
                "overflow-y": "auto",
                height: "inherit"
            })
        }
    }
};
Character.addStylesheet(),
function(t, e) {
    "object" == typeof exports && "undefined" != typeof module ? e(exports) : "function" == typeof define && define.amd ? define(["exports"], e) : e((t = t || self).IMask = {})
}(this, function(t) {
    "use strict";
    var e = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};

    function n(t, e) {
        return t(e = {
            exports: {}
        }, e.exports), e.exports
    }
    var i = function(t) {
            return t && t.Math == Math && t
        },
        s = i("object" == typeof globalThis && globalThis) || i("object" == typeof window && window) || i("object" == typeof self && self) || i("object" == typeof e && e) || Function("return this")(),
        a = function(t) {
            try {
                return !!t()
            } catch (t) {
                return !0
            }
        },
        r = !a(function() {
            return 7 != Object.defineProperty({}, "a", {
                get: function() {
                    return 7
                }
            }).a
        }),
        o = {}.propertyIsEnumerable,
        u = Object.getOwnPropertyDescriptor,
        l = {
            f: u && !o.call({
                1: 2
            }, 1) ? function(t) {
                var e = u(this, t);
                return !!e && e.enumerable
            } : o
        },
        h = function(t, e) {
            return {
                enumerable: !(1 & t),
                configurable: !(2 & t),
                writable: !(4 & t),
                value: e
            }
        },
        c = {}.toString,
        d = "".split,
        p = a(function() {
            return !Object("z").propertyIsEnumerable(0)
        }) ? function(t) {
            return "String" == function(t) {
                return c.call(t).slice(8, -1)
            }(t) ? d.call(t, "") : Object(t)
        } : Object,
        f = function(t) {
            if (null == t) throw TypeError("Can't call method on " + t);
            return t
        },
        v = function(t) {
            return p(f(t))
        },
        g = function(t) {
            return "object" == typeof t ? null !== t : "function" == typeof t
        },
        m = function(t, e) {
            if (!g(t)) return t;
            var n, i;
            if (e && "function" == typeof(n = t.toString) && !g(i = n.call(t))) return i;
            if ("function" == typeof(n = t.valueOf) && !g(i = n.call(t))) return i;
            if (!e && "function" == typeof(n = t.toString) && !g(i = n.call(t))) return i;
            throw TypeError("Can't convert object to primitive value")
        },
        k = {}.hasOwnProperty,
        _ = function(t, e) {
            return k.call(t, e)
        },
        y = s.document,
        b = g(y) && g(y.createElement),
        C = !r && !a(function() {
            return 7 != Object.defineProperty((t = "div", b ? y.createElement(t) : {}), "a", {
                get: function() {
                    return 7
                }
            }).a;
            var t
        }),
        S = Object.getOwnPropertyDescriptor,
        E = {
            f: r ? S : function(t, e) {
                if (t = v(t), e = m(e, !0), C) try {
                    return S(t, e)
                } catch (t) {}
                if (_(t, e)) return h(!l.f.call(t, e), t[e])
            }
        },
        A = function(t) {
            if (!g(t)) throw TypeError(String(t) + " is not an object");
            return t
        },
        F = Object.defineProperty,
        w = {
            f: r ? F : function(t, e, n) {
                if (A(t), e = m(e, !0), A(n), C) try {
                    return F(t, e, n)
                } catch (t) {}
                if ("get" in n || "set" in n) throw TypeError("Accessors not supported");
                return "value" in n && (t[e] = n.value), t
            }
        },
        T = r ? function(t, e, n) {
            return w.f(t, e, h(1, n))
        } : function(t, e, n) {
            return t[e] = n, t
        },
        x = function(t, e) {
            try {
                T(s, t, e)
            } catch (n) {
                s[t] = e
            }
            return e
        },
        B = s["__core-js_shared__"] || x("__core-js_shared__", {}),
        D = Function.toString;
    "function" != typeof B.inspectSource && (B.inspectSource = function(t) {
        return D.call(t)
    });
    var M, O, P, I, $ = B.inspectSource,
        R = s.WeakMap,
        N = "function" == typeof R && /native code/.test($(R)),
        j = n(function(t) {
            (t.exports = function(t, e) {
                return B[t] || (B[t] = void 0 !== e ? e : {})
            })("versions", []).push({
                version: "3.4.8",
                mode: "global",
                copyright: "© 2019 Denis Pushkarev (zloirock.ru)"
            })
        }),
        V = 0,
        L = Math.random(),
        z = j("keys"),
        H = {},
        U = s.WeakMap;
    if (N) {
        var Y = new U,
            q = Y.get,
            G = Y.has,
            W = Y.set;
        M = function(t, e) {
            return W.call(Y, t, e), e
        }, O = function(t) {
            return q.call(Y, t) || {}
        }, P = function(t) {
            return G.call(Y, t)
        }
    } else {
        var Z = z[I = "state"] || (z[I] = function(t) {
            return "Symbol(" + String(void 0 === t ? "" : t) + ")_" + (++V + L).toString(36)
        }(I));
        H[Z] = !0, M = function(t, e) {
            return T(t, Z, e), e
        }, O = function(t) {
            return _(t, Z) ? t[Z] : {}
        }, P = function(t) {
            return _(t, Z)
        }
    }
    var K = {
            set: M,
            get: O,
            has: P,
            enforce: function(t) {
                return P(t) ? O(t) : M(t, {})
            },
            getterFor: function(t) {
                return function(e) {
                    var n;
                    if (!g(e) || (n = O(e)).type !== t) throw TypeError("Incompatible receiver, " + t + " required");
                    return n
                }
            }
        },
        X = n(function(t) {
            var e = K.get,
                n = K.enforce,
                i = String(String).split("String");
            (t.exports = function(t, e, a, r) {
                var o = !!r && !!r.unsafe,
                    u = !!r && !!r.enumerable,
                    l = !!r && !!r.noTargetGet;
                "function" == typeof a && ("string" != typeof e || _(a, "name") || T(a, "name", e), n(a).source = i.join("string" == typeof e ? e : "")), t !== s ? (o ? !l && t[e] && (u = !0) : delete t[e], u ? t[e] = a : T(t, e, a)) : u ? t[e] = a : x(e, a)
            })(Function.prototype, "toString", function() {
                return "function" == typeof this && e(this).source || $(this)
            })
        }),
        J = s,
        Q = function(t) {
            return "function" == typeof t ? t : void 0
        },
        tt = function(t, e) {
            return arguments.length < 2 ? Q(J[t]) || Q(s[t]) : J[t] && J[t][e] || s[t] && s[t][e]
        },
        et = Math.ceil,
        nt = Math.floor,
        it = function(t) {
            return isNaN(t = +t) ? 0 : (t > 0 ? nt : et)(t)
        },
        st = Math.min,
        at = function(t) {
            return t > 0 ? st(it(t), 9007199254740991) : 0
        },
        rt = Math.max,
        ot = Math.min,
        ut = function(t) {
            return function(e, n, i) {
                var s, a = v(e),
                    r = at(a.length),
                    o = function(t, e) {
                        var n = it(t);
                        return n < 0 ? rt(n + e, 0) : ot(n, e)
                    }(i, r);
                if (t && n != n) {
                    for (; r > o;)
                        if ((s = a[o++]) != s) return !0
                } else
                    for (; r > o; o++)
                        if ((t || o in a) && a[o] === n) return t || o || 0;
                return !t && -1
            }
        },
        lt = {
            includes: ut(!0),
            indexOf: ut(!1)
        }.indexOf,
        ht = function(t, e) {
            var n, i = v(t),
                s = 0,
                a = [];
            for (n in i) !_(H, n) && _(i, n) && a.push(n);
            for (; e.length > s;) _(i, n = e[s++]) && (~lt(a, n) || a.push(n));
            return a
        },
        ct = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"],
        dt = ct.concat("length", "prototype"),
        pt = {
            f: Object.getOwnPropertyNames || function(t) {
                return ht(t, dt)
            }
        },
        ft = {
            f: Object.getOwnPropertySymbols
        },
        vt = tt("Reflect", "ownKeys") || function(t) {
            var e = pt.f(A(t)),
                n = ft.f;
            return n ? e.concat(n(t)) : e
        },
        gt = function(t, e) {
            for (var n = vt(e), i = w.f, s = E.f, a = 0; a < n.length; a++) {
                var r = n[a];
                _(t, r) || i(t, r, s(e, r))
            }
        },
        mt = /#|\.prototype\./,
        kt = function(t, e) {
            var n = yt[_t(t)];
            return n == Ct || n != bt && ("function" == typeof e ? a(e) : !!e)
        },
        _t = kt.normalize = function(t) {
            return String(t).replace(mt, ".").toLowerCase()
        },
        yt = kt.data = {},
        bt = kt.NATIVE = "N",
        Ct = kt.POLYFILL = "P",
        St = kt,
        Et = E.f,
        At = function(t, e) {
            var n, i, a, r, o, u = t.target,
                l = t.global,
                h = t.stat;
            if (n = l ? s : h ? s[u] || x(u, {}) : (s[u] || {}).prototype)
                for (i in e) {
                    if (r = e[i], a = t.noTargetGet ? (o = Et(n, i)) && o.value : n[i], !St(l ? i : u + (h ? "." : "#") + i, t.forced) && void 0 !== a) {
                        if (typeof r == typeof a) continue;
                        gt(r, a)
                    }(t.sham || a && a.sham) && T(r, "sham", !0), X(n, i, r, t)
                }
        },
        Ft = Object.keys || function(t) {
            return ht(t, ct)
        },
        wt = Object.assign,
        Tt = Object.defineProperty,
        xt = !wt || a(function() {
            if (r && 1 !== wt({
                    b: 1
                }, wt(Tt({}, "a", {
                    enumerable: !0,
                    get: function() {
                        Tt(this, "b", {
                            value: 3,
                            enumerable: !1
                        })
                    }
                }), {
                    b: 2
                })).b) return !0;
            var t = {},
                e = {},
                n = Symbol();
            return t[n] = 7, "abcdefghijklmnopqrst".split("").forEach(function(t) {
                e[t] = t
            }), 7 != wt({}, t)[n] || "abcdefghijklmnopqrst" != Ft(wt({}, e)).join("")
        }) ? function(t, e) {
            for (var n = Object(f(t)), i = arguments.length, s = 1, a = ft.f, o = l.f; i > s;)
                for (var u, h = p(arguments[s++]), c = a ? Ft(h).concat(a(h)) : Ft(h), d = c.length, v = 0; d > v;) u = c[v++], r && !o.call(h, u) || (n[u] = h[u]);
            return n
        } : wt;
    At({
        target: "Object",
        stat: !0,
        forced: Object.assign !== xt
    }, {
        assign: xt
    });
    var Bt = "".repeat || function(t) {
            var e = String(f(this)),
                n = "",
                i = it(t);
            if (i < 0 || i == 1 / 0) throw RangeError("Wrong number of repetitions");
            for (; i > 0;
                (i >>>= 1) && (e += e)) 1 & i && (n += e);
            return n
        },
        Dt = Math.ceil,
        Mt = function(t) {
            return function(e, n, i) {
                var s, a, r = String(f(e)),
                    o = r.length,
                    u = void 0 === i ? " " : String(i),
                    l = at(n);
                return l <= o || "" == u ? r : (s = l - o, (a = Bt.call(u, Dt(s / u.length))).length > s && (a = a.slice(0, s)), t ? r + a : a + r)
            }
        },
        Ot = {
            start: Mt(!1),
            end: Mt(!0)
        },
        Pt = tt("navigator", "userAgent") || "",
        It = /Version\/10\.\d+(\.\d+)?( Mobile\/\w+)? Safari\//.test(Pt),
        $t = Ot.end;
    At({
        target: "String",
        proto: !0,
        forced: It
    }, {
        padEnd: function(t) {
            return $t(this, t, arguments.length > 1 ? arguments[1] : void 0)
        }
    });
    var Rt = Ot.start;

    function Nt(t) {
        return (Nt = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
            return typeof t
        } : function(t) {
            return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
        })(t)
    }

    function jt(t, e) {
        if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
    }

    function Vt(t, e) {
        for (var n = 0; n < e.length; n++) {
            var i = e[n];
            i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(t, i.key, i)
        }
    }

    function Lt(t, e, n) {
        return e && Vt(t.prototype, e), n && Vt(t, n), t
    }

    function zt(t, e) {
        if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
        t.prototype = Object.create(e && e.prototype, {
            constructor: {
                value: t,
                writable: !0,
                configurable: !0
            }
        }), e && Ut(t, e)
    }

    function Ht(t) {
        return (Ht = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
            return t.__proto__ || Object.getPrototypeOf(t)
        })(t)
    }

    function Ut(t, e) {
        return (Ut = Object.setPrototypeOf || function(t, e) {
            return t.__proto__ = e, t
        })(t, e)
    }

    function Yt(t, e) {
        if (null == t) return {};
        var n, i, s = function(t, e) {
            if (null == t) return {};
            var n, i, s = {},
                a = Object.keys(t);
            for (i = 0; i < a.length; i++) n = a[i], e.indexOf(n) >= 0 || (s[n] = t[n]);
            return s
        }(t, e);
        if (Object.getOwnPropertySymbols) {
            var a = Object.getOwnPropertySymbols(t);
            for (i = 0; i < a.length; i++) n = a[i], e.indexOf(n) >= 0 || Object.prototype.propertyIsEnumerable.call(t, n) && (s[n] = t[n])
        }
        return s
    }

    function qt(t, e) {
        return !e || "object" != typeof e && "function" != typeof e ? function(t) {
            if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t
        }(t) : e
    }

    function Gt(t, e) {
        for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = Ht(t)););
        return t
    }

    function Wt(t, e, n) {
        return (Wt = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, n) {
            var i = Gt(t, e);
            if (i) {
                var s = Object.getOwnPropertyDescriptor(i, e);
                return s.get ? s.get.call(n) : s.value
            }
        })(t, e, n || t)
    }

    function Zt(t, e, n, i) {
        return (Zt = "undefined" != typeof Reflect && Reflect.set ? Reflect.set : function(t, e, n, i) {
            var s, a = Gt(t, e);
            if (a) {
                if ((s = Object.getOwnPropertyDescriptor(a, e)).set) return s.set.call(i, n), !0;
                if (!s.writable) return !1
            }
            if (s = Object.getOwnPropertyDescriptor(i, e)) {
                if (!s.writable) return !1;
                s.value = n, Object.defineProperty(i, e, s)
            } else ! function(t, e, n) {
                e in t ? Object.defineProperty(t, e, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }) : t[e] = n
            }(i, e, n);
            return !0
        })(t, e, n, i)
    }

    function Kt(t, e, n, i, s) {
        if (!Zt(t, e, n, i || t) && s) throw new Error("failed to set property");
        return n
    }

    function Xt(t, e) {
        return function(t) {
            if (Array.isArray(t)) return t
        }(t) || function(t, e) {
            if (!(Symbol.iterator in Object(t) || "[object Arguments]" === Object.prototype.toString.call(t))) return;
            var n = [],
                i = !0,
                s = !1,
                a = void 0;
            try {
                for (var r, o = t[Symbol.iterator](); !(i = (r = o.next()).done) && (n.push(r.value), !e || n.length !== e); i = !0);
            } catch (t) {
                s = !0, a = t
            } finally {
                try {
                    i || null == o.return || o.return()
                } finally {
                    if (s) throw a
                }
            }
            return n
        }(t, e) || function() {
            throw new TypeError("Invalid attempt to destructure non-iterable instance")
        }()
    }

    function Jt(t) {
        return "string" == typeof t || t instanceof String
    }
    At({
            target: "String",
            proto: !0,
            forced: It
        }, {
            padStart: function(t) {
                return Rt(this, t, arguments.length > 1 ? arguments[1] : void 0)
            }
        }), At({
            target: "String",
            proto: !0
        }, {
            repeat: Bt
        }),
        function(t) {
            function e() {
                this.globalThis = this, delete t.prototype._T_
            }
            "object" != typeof globalThis && (this ? e() : (t.defineProperty(t.prototype, "_T_", {
                configurable: !0,
                get: e
            }), _T_))
        }(Object);
    var Qt = {
        NONE: "NONE",
        LEFT: "LEFT",
        FORCE_LEFT: "FORCE_LEFT",
        RIGHT: "RIGHT",
        FORCE_RIGHT: "FORCE_RIGHT"
    };

    function te(t) {
        return t.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1")
    }
    var ee = function() {
            function t(e, n, i, s) {
                for (jt(this, t), this.value = e, this.cursorPos = n, this.oldValue = i, this.oldSelection = s; this.value.slice(0, this.startChangePos) !== this.oldValue.slice(0, this.startChangePos);) --this.oldSelection.start
            }
            return Lt(t, [{
                key: "startChangePos",
                get: function() {
                    return Math.min(this.cursorPos, this.oldSelection.start)
                }
            }, {
                key: "insertedCount",
                get: function() {
                    return this.cursorPos - this.startChangePos
                }
            }, {
                key: "inserted",
                get: function() {
                    return this.value.substr(this.startChangePos, this.insertedCount)
                }
            }, {
                key: "removedCount",
                get: function() {
                    return Math.max(this.oldSelection.end - this.startChangePos || this.oldValue.length - this.value.length, 0)
                }
            }, {
                key: "removed",
                get: function() {
                    return this.oldValue.substr(this.startChangePos, this.removedCount)
                }
            }, {
                key: "head",
                get: function() {
                    return this.value.substring(0, this.startChangePos)
                }
            }, {
                key: "tail",
                get: function() {
                    return this.value.substring(this.startChangePos + this.insertedCount)
                }
            }, {
                key: "removeDirection",
                get: function() {
                    return !this.removedCount || this.insertedCount ? Qt.NONE : this.oldSelection.end === this.cursorPos || this.oldSelection.start === this.cursorPos ? Qt.RIGHT : Qt.LEFT
                }
            }]), t
        }(),
        ne = function() {
            function t(e) {
                jt(this, t), Object.assign(this, {
                    inserted: "",
                    rawInserted: "",
                    skip: !1,
                    tailShift: 0
                }, e)
            }
            return Lt(t, [{
                key: "aggregate",
                value: function(t) {
                    return this.rawInserted += t.rawInserted, this.skip = this.skip || t.skip, this.inserted += t.inserted, this.tailShift += t.tailShift, this
                }
            }, {
                key: "offset",
                get: function() {
                    return this.tailShift + this.inserted.length
                }
            }]), t
        }(),
        ie = function() {
            function t() {
                var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "",
                    n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
                    i = arguments.length > 2 ? arguments[2] : void 0;
                jt(this, t), this.value = e, this.from = n, this.stop = i
            }
            return Lt(t, [{
                key: "toString",
                value: function() {
                    return this.value
                }
            }, {
                key: "extend",
                value: function(t) {
                    this.value += String(t)
                }
            }, {
                key: "appendTo",
                value: function(t) {
                    return t.append(this.toString(), {
                        tail: !0
                    }).aggregate(t._appendPlaceholder())
                }
            }, {
                key: "shiftBefore",
                value: function(t) {
                    if (this.from >= t || !this.value.length) return "";
                    var e = this.value[0];
                    return this.value = this.value.slice(1), e
                }
            }, {
                key: "state",
                get: function() {
                    return {
                        value: this.value,
                        from: this.from,
                        stop: this.stop
                    }
                },
                set: function(t) {
                    Object.assign(this, t)
                }
            }]), t
        }();

    function se(t) {
        var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
        return new se.InputMask(t, e)
    }
    var ae = function() {
        function t(e) {
            jt(this, t), this._value = "", this._update(Object.assign({}, t.DEFAULTS, {}, e)), this.isInitialized = !0
        }
        return Lt(t, [{
            key: "updateOptions",
            value: function(t) {
                Object.keys(t).length && this.withValueRefresh(this._update.bind(this, t))
            }
        }, {
            key: "_update",
            value: function(t) {
                Object.assign(this, t)
            }
        }, {
            key: "reset",
            value: function() {
                this._value = ""
            }
        }, {
            key: "resolve",
            value: function(t) {
                return this.reset(), this.append(t, {
                    input: !0
                }, ""), this.doCommit(), this.value
            }
        }, {
            key: "nearestInputPos",
            value: function(t, e) {
                return t
            }
        }, {
            key: "extractInput",
            value: function() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                    e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
                return this.value.slice(t, e)
            }
        }, {
            key: "extractTail",
            value: function() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                    e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
                return new ie(this.extractInput(t, e), t)
            }
        }, {
            key: "appendTail",
            value: function(t) {
                return Jt(t) && (t = new ie(String(t))), t.appendTo(this)
            }
        }, {
            key: "_appendCharRaw",
            value: function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                return (t = this.doPrepare(t, e)) ? (this._value += t, new ne({
                    inserted: t,
                    rawInserted: t
                })) : new ne
            }
        }, {
            key: "_appendChar",
            value: function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
                    n = arguments.length > 2 ? arguments[2] : void 0,
                    i = this.state,
                    s = this._appendCharRaw(t, e);
                if (s.inserted) {
                    var a, r = !1 !== this.doValidate(e);
                    if (r && null != n) {
                        var o = this.state;
                        this.overwrite && (a = n.state, n.shiftBefore(this.value.length));
                        var u = this.appendTail(n);
                        (r = u.rawInserted === n.toString()) && u.inserted && (this.state = o)
                    }
                    r || (s = new ne, this.state = i, n && a && (n.state = a))
                }
                return s
            }
        }, {
            key: "_appendPlaceholder",
            value: function() {
                return new ne
            }
        }, {
            key: "append",
            value: function(t, e, n) {
                if (!Jt(t)) throw new Error("value should be string");
                var i = new ne,
                    s = Jt(n) ? new ie(String(n)) : n;
                e.tail && (e._beforeTailState = this.state);
                for (var a = 0; a < t.length; ++a) i.aggregate(this._appendChar(t[a], e, s));
                return null != s && (i.tailShift += this.appendTail(s).tailShift), i
            }
        }, {
            key: "remove",
            value: function() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                    e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
                return this._value = this.value.slice(0, t) + this.value.slice(e), new ne
            }
        }, {
            key: "withValueRefresh",
            value: function(t) {
                if (this._refreshing || !this.isInitialized) return t();
                this._refreshing = !0;
                var e = this.rawInputValue,
                    n = this.value,
                    i = t();
                return this.rawInputValue = e, this.value !== n && 0 === n.indexOf(this._value) && this.append(n.slice(this._value.length), {}, ""), delete this._refreshing, i
            }
        }, {
            key: "runIsolated",
            value: function(t) {
                if (this._isolated || !this.isInitialized) return t(this);
                this._isolated = !0;
                var e = this.state,
                    n = t(this);
                return this.state = e, delete this._isolated, n
            }
        }, {
            key: "doPrepare",
            value: function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                return this.prepare ? this.prepare(t, this, e) : t
            }
        }, {
            key: "doValidate",
            value: function(t) {
                return (!this.validate || this.validate(this.value, this, t)) && (!this.parent || this.parent.doValidate(t))
            }
        }, {
            key: "doCommit",
            value: function() {
                this.commit && this.commit(this.value, this)
            }
        }, {
            key: "doFormat",
            value: function(t) {
                return this.format ? this.format(t, this) : t
            }
        }, {
            key: "doParse",
            value: function(t) {
                return this.parse ? this.parse(t, this) : t
            }
        }, {
            key: "splice",
            value: function(t, e, n, i) {
                var s = t + e,
                    a = this.extractTail(s),
                    r = this.nearestInputPos(t, i);
                return new ne({
                    tailShift: r - t
                }).aggregate(this.remove(r)).aggregate(this.append(n, {
                    input: !0
                }, a))
            }
        }, {
            key: "state",
            get: function() {
                return {
                    _value: this.value
                }
            },
            set: function(t) {
                this._value = t._value
            }
        }, {
            key: "value",
            get: function() {
                return this._value
            },
            set: function(t) {
                this.resolve(t)
            }
        }, {
            key: "unmaskedValue",
            get: function() {
                return this.value
            },
            set: function(t) {
                this.reset(), this.append(t, {}, ""), this.doCommit()
            }
        }, {
            key: "typedValue",
            get: function() {
                return this.doParse(this.value)
            },
            set: function(t) {
                this.value = this.doFormat(t)
            }
        }, {
            key: "rawInputValue",
            get: function() {
                return this.extractInput(0, this.value.length, {
                    raw: !0
                })
            },
            set: function(t) {
                this.reset(), this.append(t, {
                    raw: !0
                }, ""), this.doCommit()
            }
        }, {
            key: "isComplete",
            get: function() {
                return !0
            }
        }]), t
    }();

    function re(t) {
        if (null == t) throw new Error("mask property should be defined");
        return t instanceof RegExp ? se.MaskedRegExp : Jt(t) ? se.MaskedPattern : t instanceof Date || t === Date ? se.MaskedDate : t instanceof Number || "number" == typeof t || t === Number ? se.MaskedNumber : Array.isArray(t) || t === Array ? se.MaskedDynamic : se.Masked && t.prototype instanceof se.Masked ? t : t instanceof Function ? se.MaskedFunction : (console.warn("Mask not found for mask", t), se.Masked)
    }

    function oe(t) {
        if (se.Masked && t instanceof se.Masked) return t;
        var e = (t = Object.assign({}, t)).mask;
        if (se.Masked && e instanceof se.Masked) return e;
        var n = re(e);
        if (!n) throw new Error("Masked class is not found for provided mask, appropriate module needs to be import manually before creating mask.");
        return new n(t)
    }
    ae.DEFAULTS = {
        format: function(t) {
            return t
        },
        parse: function(t) {
            return t
        }
    }, se.Masked = ae, se.createMask = oe;
    var ue = {
            0: /\d/,
            a: /[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
            "*": /./
        },
        le = function() {
            function t(e) {
                jt(this, t);
                var n = e.mask,
                    i = Yt(e, ["mask"]);
                this.masked = oe({
                    mask: n
                }), Object.assign(this, i)
            }
            return Lt(t, [{
                key: "reset",
                value: function() {
                    this._isFilled = !1, this.masked.reset()
                }
            }, {
                key: "remove",
                value: function() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                        e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
                    return 0 === t && e >= 1 ? (this._isFilled = !1, this.masked.remove(t, e)) : new ne
                }
            }, {
                key: "_appendChar",
                value: function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                    if (this._isFilled) return new ne;
                    var n = this.masked.state,
                        i = this.masked._appendChar(t, e);
                    return i.inserted && !1 === this.doValidate(e) && (i.inserted = i.rawInserted = "", this.masked.state = n), i.inserted || this.isOptional || this.lazy || e.input || (i.inserted = this.placeholderChar), i.skip = !i.inserted && !this.isOptional, this._isFilled = Boolean(i.inserted), i
                }
            }, {
                key: "append",
                value: function() {
                    var t;
                    return (t = this.masked).append.apply(t, arguments)
                }
            }, {
                key: "_appendPlaceholder",
                value: function() {
                    var t = new ne;
                    return this._isFilled || this.isOptional ? t : (this._isFilled = !0, t.inserted = this.placeholderChar, t)
                }
            }, {
                key: "extractTail",
                value: function() {
                    var t;
                    return (t = this.masked).extractTail.apply(t, arguments)
                }
            }, {
                key: "appendTail",
                value: function() {
                    var t;
                    return (t = this.masked).appendTail.apply(t, arguments)
                }
            }, {
                key: "extractInput",
                value: function() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                        e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
                        n = arguments.length > 2 ? arguments[2] : void 0;
                    return this.masked.extractInput(t, e, n)
                }
            }, {
                key: "nearestInputPos",
                value: function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Qt.NONE,
                        n = this.value.length,
                        i = Math.min(Math.max(t, 0), n);
                    switch (e) {
                        case Qt.LEFT:
                        case Qt.FORCE_LEFT:
                            return this.isComplete ? i : 0;
                        case Qt.RIGHT:
                        case Qt.FORCE_RIGHT:
                            return this.isComplete ? i : n;
                        case Qt.NONE:
                        default:
                            return i
                    }
                }
            }, {
                key: "doValidate",
                value: function() {
                    var t, e;
                    return (t = this.masked).doValidate.apply(t, arguments) && (!this.parent || (e = this.parent).doValidate.apply(e, arguments))
                }
            }, {
                key: "doCommit",
                value: function() {
                    this.masked.doCommit()
                }
            }, {
                key: "value",
                get: function() {
                    return this.masked.value || (this._isFilled && !this.isOptional ? this.placeholderChar : "")
                }
            }, {
                key: "unmaskedValue",
                get: function() {
                    return this.masked.unmaskedValue
                }
            }, {
                key: "isComplete",
                get: function() {
                    return Boolean(this.masked.value) || this.isOptional
                }
            }, {
                key: "state",
                get: function() {
                    return {
                        masked: this.masked.state,
                        _isFilled: this._isFilled
                    }
                },
                set: function(t) {
                    this.masked.state = t.masked, this._isFilled = t._isFilled
                }
            }]), t
        }(),
        he = function() {
            function t(e) {
                jt(this, t), Object.assign(this, e), this._value = ""
            }
            return Lt(t, [{
                key: "reset",
                value: function() {
                    this._isRawInput = !1, this._value = ""
                }
            }, {
                key: "remove",
                value: function() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                        e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this._value.length;
                    return this._value = this._value.slice(0, t) + this._value.slice(e), this._value || (this._isRawInput = !1), new ne
                }
            }, {
                key: "nearestInputPos",
                value: function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Qt.NONE,
                        n = this._value.length;
                    switch (e) {
                        case Qt.LEFT:
                        case Qt.FORCE_LEFT:
                            return 0;
                        case Qt.NONE:
                        case Qt.RIGHT:
                        case Qt.FORCE_RIGHT:
                        default:
                            return n
                    }
                }
            }, {
                key: "extractInput",
                value: function() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                        e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this._value.length;
                    return (arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}).raw && this._isRawInput && this._value.slice(t, e) || ""
                }
            }, {
                key: "_appendChar",
                value: function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
                        n = new ne;
                    if (this._value) return n;
                    var i = this.char === t[0] && (this.isUnmasking || e.input || e.raw) && !e.tail;
                    return i && (n.rawInserted = this.char), this._value = n.inserted = this.char, this._isRawInput = i && (e.raw || e.input), n
                }
            }, {
                key: "_appendPlaceholder",
                value: function() {
                    var t = new ne;
                    return this._value ? t : (this._value = t.inserted = this.char, t)
                }
            }, {
                key: "extractTail",
                value: function() {
                    arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
                    return new ie("")
                }
            }, {
                key: "appendTail",
                value: function(t) {
                    return Jt(t) && (t = new ie(String(t))), t.appendTo(this)
                }
            }, {
                key: "append",
                value: function(t, e, n) {
                    var i = this._appendChar(t, e);
                    return null != n && (i.tailShift += this.appendTail(n).tailShift), i
                }
            }, {
                key: "doCommit",
                value: function() {}
            }, {
                key: "value",
                get: function() {
                    return this._value
                }
            }, {
                key: "unmaskedValue",
                get: function() {
                    return this.isUnmasking ? this.value : ""
                }
            }, {
                key: "isComplete",
                get: function() {
                    return !0
                }
            }, {
                key: "state",
                get: function() {
                    return {
                        _value: this._value,
                        _isRawInput: this._isRawInput
                    }
                },
                set: function(t) {
                    Object.assign(this, t)
                }
            }]), t
        }(),
        ce = function() {
            function t() {
                var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [],
                    n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
                jt(this, t), this.chunks = e, this.from = n
            }
            return Lt(t, [{
                key: "toString",
                value: function() {
                    return this.chunks.map(String).join("")
                }
            }, {
                key: "extend",
                value: function(e) {
                    if (String(e)) {
                        Jt(e) && (e = new ie(String(e)));
                        var n = this.chunks[this.chunks.length - 1],
                            i = n && (n.stop === e.stop || null == e.stop) && e.from === n.from + n.toString().length;
                        if (e instanceof ie) i ? n.extend(e.toString()) : this.chunks.push(e);
                        else if (e instanceof t) {
                            if (null == e.stop)
                                for (var s; e.chunks.length && null == e.chunks[0].stop;)(s = e.chunks.shift()).from += e.from, this.extend(s);
                            e.toString() && (e.stop = e.blockIndex, this.chunks.push(e))
                        }
                    }
                }
            }, {
                key: "appendTo",
                value: function(e) {
                    if (!(e instanceof se.MaskedPattern)) return new ie(this.toString()).appendTo(e);
                    for (var n = new ne, i = 0; i < this.chunks.length && !n.skip; ++i) {
                        var s = this.chunks[i],
                            a = e._mapPosToBlock(e.value.length),
                            r = s.stop,
                            o = void 0;
                        if (r && (!a || a.index <= r) && ((s instanceof t || e._stops.indexOf(r) >= 0) && n.aggregate(e._appendPlaceholder(r)), o = s instanceof t && e._blocks[r]), o) {
                            var u = o.appendTail(s);
                            u.skip = !1, n.aggregate(u), e._value += u.inserted;
                            var l = s.toString().slice(u.rawInserted.length);
                            l && n.aggregate(e.append(l, {
                                tail: !0
                            }))
                        } else n.aggregate(e.append(s.toString(), {
                            tail: !0
                        }))
                    }
                    return n
                }
            }, {
                key: "shiftBefore",
                value: function(t) {
                    if (this.from >= t || !this.chunks.length) return "";
                    for (var e = t - this.from, n = 0; n < this.chunks.length;) {
                        var i = this.chunks[n],
                            s = i.shiftBefore(e);
                        if (i.toString()) {
                            if (!s) break;
                            ++n
                        } else this.chunks.splice(n, 1);
                        if (s) return s
                    }
                    return ""
                }
            }, {
                key: "state",
                get: function() {
                    return {
                        chunks: this.chunks.map(function(t) {
                            return t.state
                        }),
                        from: this.from,
                        stop: this.stop,
                        blockIndex: this.blockIndex
                    }
                },
                set: function(e) {
                    var n = e.chunks,
                        i = Yt(e, ["chunks"]);
                    Object.assign(this, i), this.chunks = n.map(function(e) {
                        var n = "chunks" in e ? new t : new ie;
                        return n.state = e, n
                    })
                }
            }]), t
        }(),
        de = function(t) {
            function e() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                return jt(this, e), t.definitions = Object.assign({}, ue, t.definitions), qt(this, Ht(e).call(this, Object.assign({}, e.DEFAULTS, {}, t)))
            }
            return zt(e, ae), Lt(e, [{
                key: "_update",
                value: function() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
                    t.definitions = Object.assign({}, this.definitions, t.definitions), Wt(Ht(e.prototype), "_update", this).call(this, t), this._rebuildMask()
                }
            }, {
                key: "_rebuildMask",
                value: function() {
                    var t = this,
                        n = this.definitions;
                    this._blocks = [], this._stops = [], this._maskedBlocks = {};
                    var i = this.mask;
                    if (i && n)
                        for (var s = !1, a = !1, r = 0; r < i.length; ++r) {
                            if (this.blocks)
                                if ("continue" === function() {
                                        var e = i.slice(r),
                                            n = Object.keys(t.blocks).filter(function(t) {
                                                return 0 === e.indexOf(t)
                                            });
                                        n.sort(function(t, e) {
                                            return e.length - t.length
                                        });
                                        var s = n[0];
                                        if (s) {
                                            var a = oe(Object.assign({
                                                parent: t,
                                                lazy: t.lazy,
                                                placeholderChar: t.placeholderChar,
                                                overwrite: t.overwrite
                                            }, t.blocks[s]));
                                            return a && (t._blocks.push(a), t._maskedBlocks[s] || (t._maskedBlocks[s] = []), t._maskedBlocks[s].push(t._blocks.length - 1)), r += s.length - 1, "continue"
                                        }
                                    }()) continue;
                            var o = i[r],
                                u = o in n;
                            if (o !== e.STOP_CHAR)
                                if ("{" !== o && "}" !== o)
                                    if ("[" !== o && "]" !== o) {
                                        if (o === e.ESCAPE_CHAR) {
                                            if (!(o = i[++r])) break;
                                            u = !1
                                        }
                                        var l = u ? new le({
                                            parent: this,
                                            lazy: this.lazy,
                                            placeholderChar: this.placeholderChar,
                                            mask: n[o],
                                            isOptional: a
                                        }) : new he({
                                            char: o,
                                            isUnmasking: s
                                        });
                                        this._blocks.push(l)
                                    } else a = !a;
                            else s = !s;
                            else this._stops.push(this._blocks.length)
                        }
                }
            }, {
                key: "reset",
                value: function() {
                    Wt(Ht(e.prototype), "reset", this).call(this), this._blocks.forEach(function(t) {
                        return t.reset()
                    })
                }
            }, {
                key: "doCommit",
                value: function() {
                    this._blocks.forEach(function(t) {
                        return t.doCommit()
                    }), Wt(Ht(e.prototype), "doCommit", this).call(this)
                }
            }, {
                key: "appendTail",
                value: function(t) {
                    return Wt(Ht(e.prototype), "appendTail", this).call(this, t).aggregate(this._appendPlaceholder())
                }
            }, {
                key: "_appendCharRaw",
                value: function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                    t = this.doPrepare(t, e);
                    var n = this._mapPosToBlock(this.value.length),
                        i = new ne;
                    if (!n) return i;
                    for (var s = n.index;; ++s) {
                        var a = this._blocks[s];
                        if (!a) break;
                        var r = a._appendChar(t, e),
                            o = r.skip;
                        if (i.aggregate(r), o || r.rawInserted) break
                    }
                    return i
                }
            }, {
                key: "extractTail",
                value: function() {
                    var t = this,
                        e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                        n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
                        i = new ce;
                    return e === n ? i : (this._forEachBlocksInRange(e, n, function(e, n, s, a) {
                        var r = e.extractTail(s, a);
                        r.stop = t._findStopBefore(n), r.from = t._blockStartPos(n), r instanceof ce && (r.blockIndex = n), i.extend(r)
                    }), i)
                }
            }, {
                key: "extractInput",
                value: function() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                        e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
                        n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
                    if (t === e) return "";
                    var i = "";
                    return this._forEachBlocksInRange(t, e, function(t, e, s, a) {
                        i += t.extractInput(s, a, n)
                    }), i
                }
            }, {
                key: "_findStopBefore",
                value: function(t) {
                    for (var e, n = 0; n < this._stops.length; ++n) {
                        var i = this._stops[n];
                        if (!(i <= t)) break;
                        e = i
                    }
                    return e
                }
            }, {
                key: "_appendPlaceholder",
                value: function(t) {
                    var e = this,
                        n = new ne;
                    if (this.lazy && null == t) return n;
                    var i = this._mapPosToBlock(this.value.length);
                    if (!i) return n;
                    var s = i.index,
                        a = null != t ? t : this._blocks.length;
                    return this._blocks.slice(s, a).forEach(function(i) {
                        if (!i.lazy || null != t) {
                            var s = null != i._blocks ? [i._blocks.length] : [],
                                a = i._appendPlaceholder.apply(i, s);
                            e._value += a.inserted, n.aggregate(a)
                        }
                    }), n
                }
            }, {
                key: "_mapPosToBlock",
                value: function(t) {
                    for (var e = "", n = 0; n < this._blocks.length; ++n) {
                        var i = this._blocks[n],
                            s = e.length;
                        if (t <= (e += i.value).length) return {
                            index: n,
                            offset: t - s
                        }
                    }
                }
            }, {
                key: "_blockStartPos",
                value: function(t) {
                    return this._blocks.slice(0, t).reduce(function(t, e) {
                        return t + e.value.length
                    }, 0)
                }
            }, {
                key: "_forEachBlocksInRange",
                value: function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
                        n = arguments.length > 2 ? arguments[2] : void 0,
                        i = this._mapPosToBlock(t);
                    if (i) {
                        var s = this._mapPosToBlock(e),
                            a = s && i.index === s.index,
                            r = i.offset,
                            o = s && a ? s.offset : this._blocks[i.index].value.length;
                        if (n(this._blocks[i.index], i.index, r, o), s && !a) {
                            for (var u = i.index + 1; u < s.index; ++u) n(this._blocks[u], u, 0, this._blocks[u].value.length);
                            n(this._blocks[s.index], s.index, 0, s.offset)
                        }
                    }
                }
            }, {
                key: "remove",
                value: function() {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                        n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
                        i = Wt(Ht(e.prototype), "remove", this).call(this, t, n);
                    return this._forEachBlocksInRange(t, n, function(t, e, n, s) {
                        i.aggregate(t.remove(n, s))
                    }), i
                }
            }, {
                key: "nearestInputPos",
                value: function(t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Qt.NONE,
                        n = this._mapPosToBlock(t) || {
                            index: 0,
                            offset: 0
                        },
                        i = n.offset,
                        s = n.index,
                        a = this._blocks[s];
                    if (!a) return t;
                    var r = i;
                    0 !== r && r < a.value.length && (r = a.nearestInputPos(i, function(t) {
                        switch (t) {
                            case Qt.LEFT:
                                return Qt.FORCE_LEFT;
                            case Qt.RIGHT:
                                return Qt.FORCE_RIGHT;
                            default:
                                return t
                        }
                    }(e)));
                    var o = r === a.value.length;
                    if (!(0 === r) && !o) return this._blockStartPos(s) + r;
                    var u = o ? s + 1 : s;
                    if (e === Qt.NONE) {
                        if (u > 0) {
                            var l = u - 1,
                                h = this._blocks[l],
                                c = h.nearestInputPos(0, Qt.NONE);
                            if (!h.value.length || c !== h.value.length) return this._blockStartPos(u)
                        }
                        for (var d = u; d < this._blocks.length; ++d) {
                            var p = this._blocks[d],
                                f = p.nearestInputPos(0, Qt.NONE);
                            if (!p.value.length || f !== p.value.length) return this._blockStartPos(d) + f
                        }
                        for (var v = u - 1; v >= 0; --v) {
                            var g = this._blocks[v],
                                m = g.nearestInputPos(0, Qt.NONE);
                            if (!g.value.length || m !== g.value.length) return this._blockStartPos(v) + g.value.length
                        }
                        return t
                    }
                    if (e === Qt.LEFT || e === Qt.FORCE_LEFT) {
                        for (var k, _ = u; _ < this._blocks.length; ++_)
                            if (this._blocks[_].value) {
                                k = _;
                                break
                            } if (null != k) {
                            var y = this._blocks[k],
                                b = y.nearestInputPos(0, Qt.RIGHT);
                            if (0 === b && y.unmaskedValue.length) return this._blockStartPos(k) + b
                        }
                        for (var C, S = -1, E = u - 1; E >= 0; --E) {
                            var A = this._blocks[E],
                                F = A.nearestInputPos(A.value.length, Qt.FORCE_LEFT);
                            if (A.value && 0 === F || (C = E), 0 !== F) {
                                if (F !== A.value.length) return this._blockStartPos(E) + F;
                                S = E;
                                break
                            }
                        }
                        if (e === Qt.LEFT)
                            for (var w = S + 1; w <= Math.min(u, this._blocks.length - 1); ++w) {
                                var T = this._blocks[w],
                                    x = T.nearestInputPos(0, Qt.NONE),
                                    B = this._blockStartPos(w) + x;
                                if (B > t) break;
                                if (x !== T.value.length) return B
                            }
                        if (S >= 0) return this._blockStartPos(S) + this._blocks[S].value.length;
                        if (e === Qt.FORCE_LEFT || this.lazy && !this.extractInput() && ! function(t) {
                                if (!t) return !1;
                                var e = t.value;
                                return !e || t.nearestInputPos(0, Qt.NONE) !== e.length
                            }(this._blocks[u])) return 0;
                        if (null != C) return this._blockStartPos(C);
                        for (var D = u; D < this._blocks.length; ++D) {
                            var M = this._blocks[D],
                                O = M.nearestInputPos(0, Qt.NONE);
                            if (!M.value.length || O !== M.value.length) return this._blockStartPos(D) + O
                        }
                        return 0
                    }
                    if (e === Qt.RIGHT || e === Qt.FORCE_RIGHT) {
                        for (var P, I, $ = u; $ < this._blocks.length; ++$) {
                            var R = this._blocks[$],
                                N = R.nearestInputPos(0, Qt.NONE);
                            if (N !== R.value.length) {
                                I = this._blockStartPos($) + N, P = $;
                                break
                            }
                        }
                        if (null != P && null != I) {
                            for (var j = P; j < this._blocks.length; ++j) {
                                var V = this._blocks[j],
                                    L = V.nearestInputPos(0, Qt.FORCE_RIGHT);
                                if (L !== V.value.length) return this._blockStartPos(j) + L
                            }
                            return e === Qt.FORCE_RIGHT ? this.value.length : I
                        }
                        for (var z = Math.min(u, this._blocks.length - 1); z >= 0; --z) {
                            var H = this._blocks[z],
                                U = H.nearestInputPos(H.value.length, Qt.LEFT);
                            if (0 !== U) {
                                var Y = this._blockStartPos(z) + U;
                                if (Y >= t) return Y;
                                break
                            }
                        }
                    }
                    return t
                }
            }, {
                key: "maskedBlock",
                value: function(t) {
                    return this.maskedBlocks(t)[0]
                }
            }, {
                key: "maskedBlocks",
                value: function(t) {
                    var e = this,
                        n = this._maskedBlocks[t];
                    return n ? n.map(function(t) {
                        return e._blocks[t]
                    }) : []
                }
            }, {
                key: "state",
                get: function() {
                    return Object.assign({}, Wt(Ht(e.prototype), "state", this), {
                        _blocks: this._blocks.map(function(t) {
                            return t.state
                        })
                    })
                },
                set: function(t) {
                    var n = t._blocks,
                        i = Yt(t, ["_blocks"]);
                    this._blocks.forEach(function(t, e) {
                        return t.state = n[e]
                    }), Kt(Ht(e.prototype), "state", i, this, !0)
                }
            }, {
                key: "isComplete",
                get: function() {
                    return this._blocks.every(function(t) {
                        return t.isComplete
                    })
                }
            }, {
                key: "unmaskedValue",
                get: function() {
                    return this._blocks.reduce(function(t, e) {
                        return t + e.unmaskedValue
                    }, "")
                },
                set: function(t) {
                    Kt(Ht(e.prototype), "unmaskedValue", t, this, !0)
                }
            }, {
                key: "value",
                get: function() {
                    return this._blocks.reduce(function(t, e) {
                        return t + e.value
                    }, "")
                },
                set: function(t) {
                    Kt(Ht(e.prototype), "value", t, this, !0)
                }
            }]), e
        }();
    de.DEFAULTS = {
        lazy: !0,
        placeholderChar: "_"
    }, de.STOP_CHAR = "`", de.ESCAPE_CHAR = "\\", de.InputDefinition = le, de.FixedDefinition = he, se.MaskedPattern = de;
    var pe = function(t) {
        function e() {
            return jt(this, e), qt(this, Ht(e).apply(this, arguments))
        }
        return zt(e, de), Lt(e, [{
            key: "_update",
            value: function(t) {
                t = Object.assign({
                    to: this.to || 0,
                    from: this.from || 0
                }, t);
                var n = String(t.to).length;
                null != t.maxLength && (n = Math.max(n, t.maxLength)), t.maxLength = n;
                for (var i = String(t.from).padStart(n, "0"), s = String(t.to).padStart(n, "0"), a = 0; a < s.length && s[a] === i[a];) ++a;
                t.mask = s.slice(0, a).replace(/0/g, "\\0") + "0".repeat(n - a), Wt(Ht(e.prototype), "_update", this).call(this, t)
            }
        }, {
            key: "boundaries",
            value: function(t) {
                var e = "",
                    n = "",
                    i = Xt(t.match(/^(\D*)(\d*)(\D*)/) || [], 3),
                    s = i[1],
                    a = i[2];
                return a && (e = "0".repeat(s.length) + a, n = "9".repeat(s.length) + a), [e = e.padEnd(this.maxLength, "0"), n = n.padEnd(this.maxLength, "9")]
            }
        }, {
            key: "doPrepare",
            value: function(t) {
                var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                if (t = Wt(Ht(e.prototype), "doPrepare", this).call(this, t, n).replace(/\D/g, ""), !this.autofix) return t;
                for (var i = String(this.from).padStart(this.maxLength, "0"), s = String(this.to).padStart(this.maxLength, "0"), a = this.value, r = "", o = 0; o < t.length; ++o) {
                    var u = a + r + t[o],
                        l = Xt(this.boundaries(u), 2),
                        h = l[0],
                        c = l[1];
                    Number(c) < this.from ? r += i[u.length - 1] : Number(h) > this.to ? r += s[u.length - 1] : r += t[o]
                }
                return r
            }
        }, {
            key: "doValidate",
            value: function() {
                var t, n = this.value;
                if (-1 === n.search(/[^0]/) && n.length <= this._matchFrom) return !0;
                for (var i = Xt(this.boundaries(n), 2), s = i[0], a = i[1], r = arguments.length, o = new Array(r), u = 0; u < r; u++) o[u] = arguments[u];
                return this.from <= Number(a) && Number(s) <= this.to && (t = Wt(Ht(e.prototype), "doValidate", this)).call.apply(t, [this].concat(o))
            }
        }, {
            key: "_matchFrom",
            get: function() {
                return this.maxLength - String(this.from).length
            }
        }, {
            key: "isComplete",
            get: function() {
                return Wt(Ht(e.prototype), "isComplete", this) && Boolean(this.value)
            }
        }]), e
    }();
    se.MaskedRange = pe;
    var fe = function(t) {
        function e(t) {
            return jt(this, e), qt(this, Ht(e).call(this, Object.assign({}, e.DEFAULTS, {}, t)))
        }
        return zt(e, de), Lt(e, [{
            key: "_update",
            value: function(t) {
                t.mask === Date && delete t.mask, t.pattern && (t.mask = t.pattern);
                var n = t.blocks;
                t.blocks = Object.assign({}, e.GET_DEFAULT_BLOCKS()), t.min && (t.blocks.Y.from = t.min.getFullYear()), t.max && (t.blocks.Y.to = t.max.getFullYear()), t.min && t.max && t.blocks.Y.from === t.blocks.Y.to && (t.blocks.m.from = t.min.getMonth() + 1, t.blocks.m.to = t.max.getMonth() + 1, t.blocks.m.from === t.blocks.m.to && (t.blocks.d.from = t.min.getDate(), t.blocks.d.to = t.max.getDate())), Object.assign(t.blocks, n), Object.keys(t.blocks).forEach(function(e) {
                    var n = t.blocks[e];
                    "autofix" in n || (n.autofix = t.autofix)
                }), Wt(Ht(e.prototype), "_update", this).call(this, t)
            }
        }, {
            key: "doValidate",
            value: function() {
                for (var t, n = this.date, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
                return (t = Wt(Ht(e.prototype), "doValidate", this)).call.apply(t, [this].concat(s)) && (!this.isComplete || this.isDateExist(this.value) && null != n && (null == this.min || this.min <= n) && (null == this.max || n <= this.max))
            }
        }, {
            key: "isDateExist",
            value: function(t) {
                return this.format(this.parse(t, this), this) === t
            }
        }, {
            key: "date",
            get: function() {
                return this.typedValue
            },
            set: function(t) {
                this.typedValue = t
            }
        }, {
            key: "typedValue",
            get: function() {
                return this.isComplete ? Wt(Ht(e.prototype), "typedValue", this) : null
            },
            set: function(t) {
                Kt(Ht(e.prototype), "typedValue", t, this, !0)
            }
        }]), e
    }();
    fe.DEFAULTS = {
        pattern: "d{.}`m{.}`Y",
        format: function(t) {
            return [String(t.getDate()).padStart(2, "0"), String(t.getMonth() + 1).padStart(2, "0"), t.getFullYear()].join(".")
        },
        parse: function(t) {
            var e = Xt(t.split("."), 3),
                n = e[0],
                i = e[1],
                s = e[2];
            return new Date(s, i - 1, n)
        }
    }, fe.GET_DEFAULT_BLOCKS = function() {
        return {
            d: {
                mask: pe,
                from: 1,
                to: 31,
                maxLength: 2
            },
            m: {
                mask: pe,
                from: 1,
                to: 12,
                maxLength: 2
            },
            Y: {
                mask: pe,
                from: 1900,
                to: 9999
            }
        }
    }, se.MaskedDate = fe;
    var ve = function() {
        function t() {
            jt(this, t)
        }
        return Lt(t, [{
            key: "select",
            value: function(t, e) {
                if (null != t && null != e && (t !== this.selectionStart || e !== this.selectionEnd)) try {
                    this._unsafeSelect(t, e)
                } catch (t) {}
            }
        }, {
            key: "_unsafeSelect",
            value: function(t, e) {}
        }, {
            key: "bindEvents",
            value: function(t) {}
        }, {
            key: "unbindEvents",
            value: function() {}
        }, {
            key: "selectionStart",
            get: function() {
                var t;
                try {
                    t = this._unsafeSelectionStart
                } catch (t) {}
                return null != t ? t : this.value.length
            }
        }, {
            key: "selectionEnd",
            get: function() {
                var t;
                try {
                    t = this._unsafeSelectionEnd
                } catch (t) {}
                return null != t ? t : this.value.length
            }
        }, {
            key: "isActive",
            get: function() {
                return !1
            }
        }]), t
    }();
    se.MaskElement = ve;
    var ge = function(t) {
        function e(t) {
            var n;
            return jt(this, e), (n = qt(this, Ht(e).call(this))).input = t, n._handlers = {}, n
        }
        return zt(e, ve), Lt(e, [{
            key: "_unsafeSelect",
            value: function(t, e) {
                this.input.setSelectionRange(t, e)
            }
        }, {
            key: "bindEvents",
            value: function(t) {
                var n = this;
                Object.keys(t).forEach(function(i) {
                    return n._toggleEventHandler(e.EVENTS_MAP[i], t[i])
                })
            }
        }, {
            key: "unbindEvents",
            value: function() {
                var t = this;
                Object.keys(this._handlers).forEach(function(e) {
                    return t._toggleEventHandler(e)
                })
            }
        }, {
            key: "_toggleEventHandler",
            value: function(t, e) {
                this._handlers[t] && (this.input.removeEventListener(t, this._handlers[t]), delete this._handlers[t]), e && (this.input.addEventListener(t, e), this._handlers[t] = e)
            }
        }, {
            key: "rootElement",
            get: function() {
                return this.input.getRootNode ? this.input.getRootNode() : document
            }
        }, {
            key: "isActive",
            get: function() {
                return this.input === this.rootElement.activeElement
            }
        }, {
            key: "_unsafeSelectionStart",
            get: function() {
                return this.input.selectionStart
            }
        }, {
            key: "_unsafeSelectionEnd",
            get: function() {
                return this.input.selectionEnd
            }
        }, {
            key: "value",
            get: function() {
                return this.input.value
            },
            set: function(t) {
                this.input.value = t
            }
        }]), e
    }();
    ge.EVENTS_MAP = {
        selectionChange: "keydown",
        input: "input",
        drop: "drop",
        click: "click",
        focus: "focus",
        commit: "blur"
    }, se.HTMLMaskElement = ge;
    var me = function(t) {
        function e() {
            return jt(this, e), qt(this, Ht(e).apply(this, arguments))
        }
        return zt(e, ge), Lt(e, [{
            key: "_unsafeSelect",
            value: function(t, e) {
                if (this.rootElement.createRange) {
                    var n = this.rootElement.createRange();
                    n.setStart(this.input.firstChild || this.input, t), n.setEnd(this.input.lastChild || this.input, e);
                    var i = this.rootElement,
                        s = i.getSelection && i.getSelection();
                    s && (s.removeAllRanges(), s.addRange(n))
                }
            }
        }, {
            key: "_unsafeSelectionStart",
            get: function() {
                var t = this.rootElement,
                    e = t.getSelection && t.getSelection();
                return e && e.anchorOffset
            }
        }, {
            key: "_unsafeSelectionEnd",
            get: function() {
                var t = this.rootElement,
                    e = t.getSelection && t.getSelection();
                return e && this._unsafeSelectionStart + String(e).length
            }
        }, {
            key: "value",
            get: function() {
                return this.input.textContent
            },
            set: function(t) {
                this.input.textContent = t
            }
        }]), e
    }();
    se.HTMLContenteditableMaskElement = me;
    var ke = function() {
        function t(e, n) {
            jt(this, t), this.el = e instanceof ve ? e : e.isContentEditable && "INPUT" !== e.tagName && "TEXTAREA" !== e.tagName ? new me(e) : new ge(e), this.masked = oe(n), this._listeners = {}, this._value = "", this._unmaskedValue = "", this._saveSelection = this._saveSelection.bind(this), this._onInput = this._onInput.bind(this), this._onChange = this._onChange.bind(this), this._onDrop = this._onDrop.bind(this), this._onFocus = this._onFocus.bind(this), this._onClick = this._onClick.bind(this), this.alignCursor = this.alignCursor.bind(this), this.alignCursorFriendly = this.alignCursorFriendly.bind(this), this._bindEvents(), this.updateValue(), this._onChange()
        }
        return Lt(t, [{
            key: "maskEquals",
            value: function(t) {
                return null == t || t === this.masked.mask || t === Date && this.masked instanceof fe
            }
        }, {
            key: "_bindEvents",
            value: function() {
                this.el.bindEvents({
                    selectionChange: this._saveSelection,
                    input: this._onInput,
                    drop: this._onDrop,
                    click: this._onClick,
                    focus: this._onFocus,
                    commit: this._onChange
                })
            }
        }, {
            key: "_unbindEvents",
            value: function() {
                this.el.unbindEvents()
            }
        }, {
            key: "_fireEvent",
            value: function(t) {
                var e = this._listeners[t];
                e && e.forEach(function(t) {
                    return t()
                })
            }
        }, {
            key: "_saveSelection",
            value: function() {
                this.value !== this.el.value && console.warn("Element value was changed outside of mask. Syncronize mask using `mask.updateValue()` to work properly."), this._selection = {
                    start: this.selectionStart,
                    end: this.cursorPos
                }
            }
        }, {
            key: "updateValue",
            value: function() {
                this.masked.value = this.el.value, this._value = this.masked.value
            }
        }, {
            key: "updateControl",
            value: function() {
                var t = this.masked.unmaskedValue,
                    e = this.masked.value,
                    n = this.unmaskedValue !== t || this.value !== e;
                this._unmaskedValue = t, this._value = e, this.el.value !== e && (this.el.value = e), n && this._fireChangeEvents()
            }
        }, {
            key: "updateOptions",
            value: function(t) {
                var e = t.mask,
                    n = Yt(t, ["mask"]),
                    i = !this.maskEquals(e),
                    s = ! function t(e, n) {
                        if (n === e) return !0;
                        var i, s = Array.isArray(n),
                            a = Array.isArray(e);
                        if (s && a) {
                            if (n.length != e.length) return !1;
                            for (i = 0; i < n.length; i++)
                                if (!t(n[i], e[i])) return !1;
                            return !0
                        }
                        if (s != a) return !1;
                        if (n && e && "object" === Nt(n) && "object" === Nt(e)) {
                            var r = n instanceof Date,
                                o = e instanceof Date;
                            if (r && o) return n.getTime() == e.getTime();
                            if (r != o) return !1;
                            var u = n instanceof RegExp,
                                l = e instanceof RegExp;
                            if (u && l) return n.toString() == e.toString();
                            if (u != l) return !1;
                            var h = Object.keys(n);
                            for (i = 0; i < h.length; i++)
                                if (!Object.prototype.hasOwnProperty.call(e, h[i])) return !1;
                            for (i = 0; i < h.length; i++)
                                if (!t(e[h[i]], n[h[i]])) return !1;
                            return !0
                        }
                        return !(!n || !e || "function" != typeof n || "function" != typeof e) && n.toString() === e.toString()
                    }(this.masked, n);
                i && (this.mask = e), s && this.masked.updateOptions(n), (i || s) && this.updateControl()
            }
        }, {
            key: "updateCursor",
            value: function(t) {
                null != t && (this.cursorPos = t, this._delayUpdateCursor(t))
            }
        }, {
            key: "_delayUpdateCursor",
            value: function(t) {
                var e = this;
                this._abortUpdateCursor(), this._changingCursorPos = t, this._cursorChanging = setTimeout(function() {
                    e.el && (e.cursorPos = e._changingCursorPos, e._abortUpdateCursor())
                }, 10)
            }
        }, {
            key: "_fireChangeEvents",
            value: function() {
                this._fireEvent("accept"), this.masked.isComplete && this._fireEvent("complete")
            }
        }, {
            key: "_abortUpdateCursor",
            value: function() {
                this._cursorChanging && (clearTimeout(this._cursorChanging), delete this._cursorChanging)
            }
        }, {
            key: "alignCursor",
            value: function() {
                this.cursorPos = this.masked.nearestInputPos(this.cursorPos, Qt.LEFT)
            }
        }, {
            key: "alignCursorFriendly",
            value: function() {
                this.selectionStart === this.cursorPos && this.alignCursor()
            }
        }, {
            key: "on",
            value: function(t, e) {
                return this._listeners[t] || (this._listeners[t] = []), this._listeners[t].push(e), this
            }
        }, {
            key: "off",
            value: function(t, e) {
                if (!this._listeners[t]) return this;
                if (!e) return delete this._listeners[t], this;
                var n = this._listeners[t].indexOf(e);
                return n >= 0 && this._listeners[t].splice(n, 1), this
            }
        }, {
            key: "_onInput",
            value: function() {
                if (this._abortUpdateCursor(), !this._selection) return this.updateValue();
                var t = new ee(this.el.value, this.cursorPos, this.value, this._selection),
                    e = this.masked.rawInputValue,
                    n = this.masked.splice(t.startChangePos, t.removed.length, t.inserted, t.removeDirection).offset,
                    i = e === this.masked.rawInputValue ? t.removeDirection : Qt.NONE,
                    s = this.masked.nearestInputPos(t.startChangePos + n, i);
                this.updateControl(), this.updateCursor(s)
            }
        }, {
            key: "_onChange",
            value: function() {
                this.value !== this.el.value && this.updateValue(), this.masked.doCommit(), this.updateControl(), this._saveSelection()
            }
        }, {
            key: "_onDrop",
            value: function(t) {
                t.preventDefault(), t.stopPropagation()
            }
        }, {
            key: "_onFocus",
            value: function(t) {
                this.alignCursorFriendly()
            }
        }, {
            key: "_onClick",
            value: function(t) {
                this.alignCursorFriendly()
            }
        }, {
            key: "destroy",
            value: function() {
                this._unbindEvents(), this._listeners.length = 0, delete this.el
            }
        }, {
            key: "mask",
            get: function() {
                return this.masked.mask
            },
            set: function(t) {
                if (!this.maskEquals(t))
                    if (this.masked.constructor !== re(t)) {
                        var e = oe({
                            mask: t
                        });
                        e.unmaskedValue = this.masked.unmaskedValue, this.masked = e
                    } else this.masked.updateOptions({
                        mask: t
                    })
            }
        }, {
            key: "value",
            get: function() {
                return this._value
            },
            set: function(t) {
                this.masked.value = t, this.updateControl(), this.alignCursor()
            }
        }, {
            key: "unmaskedValue",
            get: function() {
                return this._unmaskedValue
            },
            set: function(t) {
                this.masked.unmaskedValue = t, this.updateControl(), this.alignCursor()
            }
        }, {
            key: "typedValue",
            get: function() {
                return this.masked.typedValue
            },
            set: function(t) {
                this.masked.typedValue = t, this.updateControl(), this.alignCursor()
            }
        }, {
            key: "selectionStart",
            get: function() {
                return this._cursorChanging ? this._changingCursorPos : this.el.selectionStart
            }
        }, {
            key: "cursorPos",
            get: function() {
                return this._cursorChanging ? this._changingCursorPos : this.el.selectionEnd
            },
            set: function(t) {
                this.el.isActive && (this.el.select(t, t), this._saveSelection())
            }
        }]), t
    }();
    se.InputMask = ke;
    var _e = function(t) {
        function e() {
            return jt(this, e), qt(this, Ht(e).apply(this, arguments))
        }
        return zt(e, de), Lt(e, [{
            key: "_update",
            value: function(t) {
                t.enum && (t.mask = "*".repeat(t.enum[0].length)), Wt(Ht(e.prototype), "_update", this).call(this, t)
            }
        }, {
            key: "doValidate",
            value: function() {
                for (var t, n = this, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
                return this.enum.some(function(t) {
                    return t.indexOf(n.unmaskedValue) >= 0
                }) && (t = Wt(Ht(e.prototype), "doValidate", this)).call.apply(t, [this].concat(s))
            }
        }]), e
    }();
    se.MaskedEnum = _e;
    var ye = function(t) {
        function e(t) {
            return jt(this, e), qt(this, Ht(e).call(this, Object.assign({}, e.DEFAULTS, {}, t)))
        }
        return zt(e, ae), Lt(e, [{
            key: "_update",
            value: function(t) {
                Wt(Ht(e.prototype), "_update", this).call(this, t), this._updateRegExps()
            }
        }, {
            key: "_updateRegExps",
            value: function() {
                var t = "^" + (this.allowNegative ? "[+|\\-]?" : ""),
                    e = (this.scale ? "(" + te(this.radix) + "\\d{0," + this.scale + "})?" : "") + "$";
                this._numberRegExpInput = new RegExp(t + "(0|([1-9]+\\d*))?" + e), this._numberRegExp = new RegExp(t + "\\d*" + e), this._mapToRadixRegExp = new RegExp("[" + this.mapToRadix.map(te).join("") + "]", "g"), this._thousandsSeparatorRegExp = new RegExp(te(this.thousandsSeparator), "g")
            }
        }, {
            key: "_removeThousandsSeparators",
            value: function(t) {
                return t.replace(this._thousandsSeparatorRegExp, "")
            }
        }, {
            key: "_insertThousandsSeparators",
            value: function(t) {
                var e = t.split(this.radix);
                return e[0] = e[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandsSeparator), e.join(this.radix)
            }
        }, {
            key: "doPrepare",
            value: function(t) {
                for (var n, i = arguments.length, s = new Array(i > 1 ? i - 1 : 0), a = 1; a < i; a++) s[a - 1] = arguments[a];
                return (n = Wt(Ht(e.prototype), "doPrepare", this)).call.apply(n, [this, this._removeThousandsSeparators(t.replace(this._mapToRadixRegExp, this.radix))].concat(s))
            }
        }, {
            key: "_separatorsCount",
            value: function(t) {
                for (var e = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], n = 0, i = 0; i < t; ++i) this._value.indexOf(this.thousandsSeparator, i) === i && (++n, e && (t += this.thousandsSeparator.length));
                return n
            }
        }, {
            key: "_separatorsCountFromSlice",
            value: function() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : this._value;
                return this._separatorsCount(this._removeThousandsSeparators(t).length, !0)
            }
        }, {
            key: "extractInput",
            value: function() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                    n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
                    i = arguments.length > 2 ? arguments[2] : void 0,
                    s = Xt(this._adjustRangeWithSeparators(t, n), 2);
                return t = s[0], n = s[1], this._removeThousandsSeparators(Wt(Ht(e.prototype), "extractInput", this).call(this, t, n, i))
            }
        }, {
            key: "_appendCharRaw",
            value: function(t) {
                var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                if (!this.thousandsSeparator) return Wt(Ht(e.prototype), "_appendCharRaw", this).call(this, t, n);
                var i = n.tail && n._beforeTailState ? n._beforeTailState._value : this._value,
                    s = this._separatorsCountFromSlice(i);
                this._value = this._removeThousandsSeparators(this.value);
                var a = Wt(Ht(e.prototype), "_appendCharRaw", this).call(this, t, n);
                this._value = this._insertThousandsSeparators(this._value);
                var r = n.tail && n._beforeTailState ? n._beforeTailState._value : this._value,
                    o = this._separatorsCountFromSlice(r);
                return a.tailShift += (o - s) * this.thousandsSeparator.length, a
            }
        }, {
            key: "_findSeparatorAround",
            value: function(t) {
                if (this.thousandsSeparator) {
                    var e = t - this.thousandsSeparator.length + 1,
                        n = this.value.indexOf(this.thousandsSeparator, e);
                    if (n <= t) return n
                }
                return -1
            }
        }, {
            key: "_adjustRangeWithSeparators",
            value: function(t, e) {
                var n = this._findSeparatorAround(t);
                n >= 0 && (t = n);
                var i = this._findSeparatorAround(e);
                return i >= 0 && (e = i + this.thousandsSeparator.length), [t, e]
            }
        }, {
            key: "remove",
            value: function() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
                    e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
                    n = Xt(this._adjustRangeWithSeparators(t, e), 2);
                t = n[0], e = n[1];
                var i = this.value.slice(0, t),
                    s = this.value.slice(e),
                    a = this._separatorsCount(i.length);
                this._value = this._insertThousandsSeparators(this._removeThousandsSeparators(i + s));
                var r = this._separatorsCountFromSlice(i);
                return new ne({
                    tailShift: (r - a) * this.thousandsSeparator.length
                })
            }
        }, {
            key: "nearestInputPos",
            value: function(t, e) {
                if (!this.thousandsSeparator) return t;
                switch (e) {
                    case Qt.NONE:
                    case Qt.LEFT:
                    case Qt.FORCE_LEFT:
                        var n = this._findSeparatorAround(t - 1);
                        if (n >= 0) {
                            var i = n + this.thousandsSeparator.length;
                            if (t < i || this.value.length <= i || e === Qt.FORCE_LEFT) return n
                        }
                        break;
                    case Qt.RIGHT:
                    case Qt.FORCE_RIGHT:
                        var s = this._findSeparatorAround(t);
                        if (s >= 0) return s + this.thousandsSeparator.length
                }
                return t
            }
        }, {
            key: "doValidate",
            value: function(t) {
                var n = (t.input ? this._numberRegExpInput : this._numberRegExp).test(this._removeThousandsSeparators(this.value));
                if (n) {
                    var i = this.number;
                    n = n && !isNaN(i) && (null == this.min || this.min >= 0 || this.min <= this.number) && (null == this.max || this.max <= 0 || this.number <= this.max)
                }
                return n && Wt(Ht(e.prototype), "doValidate", this).call(this, t)
            }
        }, {
            key: "doCommit",
            value: function() {
                if (this.value) {
                    var t = this.number,
                        n = t;
                    null != this.min && (n = Math.max(n, this.min)), null != this.max && (n = Math.min(n, this.max)), n !== t && (this.unmaskedValue = String(n));
                    var i = this.value;
                    this.normalizeZeros && (i = this._normalizeZeros(i)), this.padFractionalZeros && (i = this._padFractionalZeros(i)), this._value = i
                }
                Wt(Ht(e.prototype), "doCommit", this).call(this)
            }
        }, {
            key: "_normalizeZeros",
            value: function(t) {
                var e = this._removeThousandsSeparators(t).split(this.radix);
                return e[0] = e[0].replace(/^(\D*)(0*)(\d*)/, function(t, e, n, i) {
                    return e + i
                }), t.length && !/\d$/.test(e[0]) && (e[0] = e[0] + "0"), e.length > 1 && (e[1] = e[1].replace(/0*$/, ""), e[1].length || (e.length = 1)), this._insertThousandsSeparators(e.join(this.radix))
            }
        }, {
            key: "_padFractionalZeros",
            value: function(t) {
                if (!t) return t;
                var e = t.split(this.radix);
                return e.length < 2 && e.push(""), e[1] = e[1].padEnd(this.scale, "0"), e.join(this.radix)
            }
        }, {
            key: "unmaskedValue",
            get: function() {
                return this._removeThousandsSeparators(this._normalizeZeros(this.value)).replace(this.radix, ".")
            },
            set: function(t) {
                Kt(Ht(e.prototype), "unmaskedValue", t.replace(".", this.radix), this, !0)
            }
        }, {
            key: "typedValue",
            get: function() {
                return Number(this.unmaskedValue)
            },
            set: function(t) {
                Kt(Ht(e.prototype), "unmaskedValue", String(t), this, !0)
            }
        }, {
            key: "number",
            get: function() {
                return this.typedValue
            },
            set: function(t) {
                this.typedValue = t
            }
        }, {
            key: "allowNegative",
            get: function() {
                return this.signed || null != this.min && this.min < 0 || null != this.max && this.max < 0
            }
        }]), e
    }();
    ye.DEFAULTS = {
        radix: ",",
        thousandsSeparator: "",
        mapToRadix: ["."],
        scale: 2,
        signed: !1,
        normalizeZeros: !0,
        padFractionalZeros: !1
    }, se.MaskedNumber = ye;
    var be = function(t) {
        function e() {
            return jt(this, e), qt(this, Ht(e).apply(this, arguments))
        }
        return zt(e, ae), Lt(e, [{
            key: "_update",
            value: function(t) {
                t.mask && (t.validate = function(e) {
                    return e.search(t.mask) >= 0
                }), Wt(Ht(e.prototype), "_update", this).call(this, t)
            }
        }]), e
    }();
    se.MaskedRegExp = be;
    var Ce = function(t) {
        function e() {
            return jt(this, e), qt(this, Ht(e).apply(this, arguments))
        }
        return zt(e, ae), Lt(e, [{
            key: "_update",
            value: function(t) {
                t.mask && (t.validate = t.mask), Wt(Ht(e.prototype), "_update", this).call(this, t)
            }
        }]), e
    }();
    se.MaskedFunction = Ce;
    var Se = function(t) {
        function e(t) {
            var n;
            return jt(this, e), (n = qt(this, Ht(e).call(this, Object.assign({}, e.DEFAULTS, {}, t)))).currentMask = null, n
        }
        return zt(e, ae), Lt(e, [{
            key: "_update",
            value: function(t) {
                Wt(Ht(e.prototype), "_update", this).call(this, t), "mask" in t && (this.compiledMasks = Array.isArray(t.mask) ? t.mask.map(function(t) {
                    return oe(t)
                }) : [])
            }
        }, {
            key: "_appendCharRaw",
            value: function() {
                var t, e = this._applyDispatch.apply(this, arguments);
                this.currentMask && e.aggregate((t = this.currentMask)._appendChar.apply(t, arguments));
                return e
            }
        }, {
            key: "_applyDispatch",
            value: function() {
                var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "",
                    e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
                    n = e.tail && null != e._beforeTailState ? e._beforeTailState._value : this.value,
                    i = this.rawInputValue,
                    s = e.tail && null != e._beforeTailState ? e._beforeTailState._rawInputValue : i,
                    a = i.slice(s.length),
                    r = this.currentMask,
                    o = new ne,
                    u = r && r.state;
                if (this.currentMask = this.doDispatch(t, Object.assign({}, e)), this.currentMask)
                    if (this.currentMask !== r) {
                        this.currentMask.reset();
                        var l = this.currentMask.append(s, {
                            raw: !0
                        });
                        o.tailShift = l.inserted.length - n.length, a && (o.tailShift += this.currentMask.append(a, {
                            raw: !0,
                            tail: !0
                        }).tailShift)
                    } else this.currentMask.state = u;
                return o
            }
        }, {
            key: "_appendPlaceholder",
            value: function() {
                var t = this._applyDispatch.apply(this, arguments);
                return this.currentMask && t.aggregate(this.currentMask._appendPlaceholder()), t
            }
        }, {
            key: "doDispatch",
            value: function(t) {
                var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                return this.dispatch(t, this, e)
            }
        }, {
            key: "doValidate",
            value: function() {
                for (var t, n, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
                return (t = Wt(Ht(e.prototype), "doValidate", this)).call.apply(t, [this].concat(s)) && (!this.currentMask || (n = this.currentMask).doValidate.apply(n, s))
            }
        }, {
            key: "reset",
            value: function() {
                this.currentMask && this.currentMask.reset(), this.compiledMasks.forEach(function(t) {
                    return t.reset()
                })
            }
        }, {
            key: "remove",
            value: function() {
                var t, e = new ne;
                this.currentMask && e.aggregate((t = this.currentMask).remove.apply(t, arguments)).aggregate(this._applyDispatch());
                return e
            }
        }, {
            key: "extractInput",
            value: function() {
                var t;
                return this.currentMask ? (t = this.currentMask).extractInput.apply(t, arguments) : ""
            }
        }, {
            key: "extractTail",
            value: function() {
                for (var t, n, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
                return this.currentMask ? (t = this.currentMask).extractTail.apply(t, s) : (n = Wt(Ht(e.prototype), "extractTail", this)).call.apply(n, [this].concat(s))
            }
        }, {
            key: "doCommit",
            value: function() {
                this.currentMask && this.currentMask.doCommit(), Wt(Ht(e.prototype), "doCommit", this).call(this)
            }
        }, {
            key: "nearestInputPos",
            value: function() {
                for (var t, n, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
                return this.currentMask ? (t = this.currentMask).nearestInputPos.apply(t, s) : (n = Wt(Ht(e.prototype), "nearestInputPos", this)).call.apply(n, [this].concat(s))
            }
        }, {
            key: "value",
            get: function() {
                return this.currentMask ? this.currentMask.value : ""
            },
            set: function(t) {
                Kt(Ht(e.prototype), "value", t, this, !0)
            }
        }, {
            key: "unmaskedValue",
            get: function() {
                return this.currentMask ? this.currentMask.unmaskedValue : ""
            },
            set: function(t) {
                Kt(Ht(e.prototype), "unmaskedValue", t, this, !0)
            }
        }, {
            key: "typedValue",
            get: function() {
                return this.currentMask ? this.currentMask.typedValue : ""
            },
            set: function(t) {
                var e = String(t);
                this.currentMask && (this.currentMask.typedValue = t, e = this.currentMask.unmaskedValue), this.unmaskedValue = e
            }
        }, {
            key: "isComplete",
            get: function() {
                return !!this.currentMask && this.currentMask.isComplete
            }
        }, {
            key: "state",
            get: function() {
                return Object.assign({}, Wt(Ht(e.prototype), "state", this), {
                    _rawInputValue: this.rawInputValue,
                    compiledMasks: this.compiledMasks.map(function(t) {
                        return t.state
                    }),
                    currentMaskRef: this.currentMask,
                    currentMask: this.currentMask && this.currentMask.state
                })
            },
            set: function(t) {
                var n = t.compiledMasks,
                    i = t.currentMaskRef,
                    s = t.currentMask,
                    a = Yt(t, ["compiledMasks", "currentMaskRef", "currentMask"]);
                this.compiledMasks.forEach(function(t, e) {
                    return t.state = n[e]
                }), null != i && (this.currentMask = i, this.currentMask.state = s), Kt(Ht(e.prototype), "state", a, this, !0)
            }
        }, {
            key: "overwrite",
            get: function() {
                return this.currentMask ? this.currentMask.overwrite : Wt(Ht(e.prototype), "overwrite", this)
            },
            set: function(t) {
                console.warn('"overwrite" option is not available in dynamic mask, use this option in siblings')
            }
        }]), e
    }();
    Se.DEFAULTS = {
        dispatch: function(t, e, n) {
            if (e.compiledMasks.length) {
                var i = e.rawInputValue,
                    s = e.compiledMasks.map(function(e, s) {
                        return e.reset(), e.append(i, {
                            raw: !0
                        }), e.append(t, n), {
                            weight: e.rawInputValue.length,
                            index: s
                        }
                    });
                return s.sort(function(t, e) {
                    return e.weight - t.weight
                }), e.compiledMasks[s[0].index]
            }
        }
    }, se.MaskedDynamic = Se;
    var Ee = {
        MASKED: "value",
        UNMASKED: "unmaskedValue",
        TYPED: "typedValue"
    };

    function Ae(t) {
        var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Ee.MASKED,
            n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : Ee.MASKED,
            i = oe(t);
        return function(t) {
            return i.runIsolated(function(i) {
                return i[e] = t, i[n]
            })
        }
    }

    function Fe(t) {
        for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), i = 1; i < e; i++) n[i - 1] = arguments[i];
        return Ae.apply(void 0, n)(t)
    }
    se.PIPE_TYPE = Ee, se.createPipe = Ae, se.pipe = Fe, globalThis.IMask = se, t.HTMLContenteditableMaskElement = me, t.HTMLMaskElement = ge, t.InputMask = ke, t.MaskElement = ve, t.Masked = ae, t.MaskedDate = fe, t.MaskedDynamic = Se, t.MaskedEnum = _e, t.MaskedFunction = Ce, t.MaskedNumber = ye, t.MaskedPattern = de, t.MaskedRange = pe, t.MaskedRegExp = be, t.PIPE_TYPE = Ee, t.createMask = oe, t.createPipe = Ae, t.default = se, t.pipe = Fe, Object.defineProperty(t, "__esModule", {
        value: !0
    })
}),
function(t) {
    "function" == typeof define && define.amd ? define(["jquery"], function(e) {
        return t(e, window, document)
    }) : "object" == typeof exports ? module.exports = t(require("jquery"), window, document) : t($, window, document)
}(function(t, e, n) {
    "use strict";
    var i, s, a, r, o, u, l, h, c, d, p, f, v, g, m, k, _, y, b, C;
    v = {
        paneClass: "nano-pane",
        sliderClass: "nano-slider",
        contentClass: "nano-content",
        enabledClass: "has-scrollbar",
        flashedClass: "flashed",
        activeClass: "active",
        iOSNativeScrolling: !1,
        preventPageScrolling: !1,
        disableResize: !1,
        alwaysVisible: !1,
        flashDelay: 1500,
        sliderMinHeight: 20,
        sliderMaxHeight: null,
        documentContext: null,
        windowContext: null
    }, d = "scroll", r = "mousedown", o = "mouseenter", u = "mousemove", l = "mousewheel", c = "resize", a = "DOMMouseScroll", p = "touchmove", i = "Microsoft Internet Explorer" === e.navigator.appName && /msie 7./i.test(e.navigator.appVersion) && e.ActiveXObject, s = null, _ = e.requestAnimationFrame, f = e.cancelAnimationFrame, b = n.createElement("div").style, C = function() {
        var t, e, n, i;
        for (t = n = 0, i = (e = ["t", "webkitT", "MozT", "msT", "OT"]).length; i > n; t = ++n)
            if (e[t], e[t] + "ransform" in b) return e[t].substr(0, e[t].length - 1);
        return !1
    }(), y = function(t) {
        return !1 !== C && ("" === C ? t : C + t.charAt(0).toUpperCase() + t.substr(1))
    }("transform"), m = !1 !== y, g = function() {
        var t, e, i;
        return (e = (t = n.createElement("div")).style).position = "absolute", e.width = "100px", e.height = "100px", e.overflow = d, e.top = "-9999px", n.body.appendChild(t), i = t.offsetWidth - t.clientWidth, n.body.removeChild(t), i
    }, k = function() {
        var t, n, i;
        return n = e.navigator.userAgent, !!(t = /(?=.+Mac OS X)(?=.+Firefox)/.test(n)) && ((i = /Firefox\/\d{2}\./.exec(n)) && (i = i[0].replace(/\D+/g, "")), t && +i > 23)
    }, h = function() {
        function h(i, a) {
            this.el = i, this.options = a, s || (s = g()), this.$el = t(this.el), this.doc = t(this.options.documentContext || n), this.win = t(this.options.windowContext || e), this.body = this.doc.find("body"), this.$content = this.$el.children("." + this.options.contentClass), this.$content.attr("tabindex", this.options.tabIndex || 0), this.content = this.$content[0], this.previousPosition = 0, this.options.iOSNativeScrolling && null != this.el.style.WebkitOverflowScrolling ? this.nativeScrolling() : this.generate(), this.createEvents(), this.addEvents(), this.reset()
        }
        return h.prototype.preventScrolling = function(t, e) {
            if (this.isActive)
                if (t.type === a)("down" === e && t.originalEvent.detail > 0 || "up" === e && t.originalEvent.detail < 0) && t.preventDefault();
                else if (t.type === l) {
                if (!t.originalEvent || !t.originalEvent.wheelDelta) return;
                ("down" === e && t.originalEvent.wheelDelta < 0 || "up" === e && t.originalEvent.wheelDelta > 0) && t.preventDefault()
            }
        }, h.prototype.nativeScrolling = function() {
            this.$content.css({
                WebkitOverflowScrolling: "touch"
            }), this.iOSNativeScrolling = !0, this.isActive = !0
        }, h.prototype.updateScrollValues = function() {
            var t, e;
            t = this.content, this.maxScrollTop = t.scrollHeight - t.clientHeight, this.prevScrollTop = this.contentScrollTop || 0, this.contentScrollTop = t.scrollTop, e = this.contentScrollTop > this.previousPosition ? "down" : this.contentScrollTop < this.previousPosition ? "up" : "same", this.previousPosition = this.contentScrollTop, "same" !== e && this.$el.trigger("update", {
                position: this.contentScrollTop,
                maximum: this.maxScrollTop,
                direction: e
            }), this.iOSNativeScrolling || (this.maxSliderTop = this.paneHeight - this.sliderHeight, this.sliderTop = 0 === this.maxScrollTop ? 0 : this.contentScrollTop * this.maxSliderTop / this.maxScrollTop)
        }, h.prototype.setOnScrollStyles = function() {
            var t, e;
            m ? (t = {})[y] = "translate(0, " + this.sliderTop + "px)" : t = {
                top: this.sliderTop
            }, _ ? (f && this.scrollRAF && f(this.scrollRAF), this.scrollRAF = _((e = this, function() {
                return e.scrollRAF = null, e.slider.css(t)
            }))) : this.slider.css(t)
        }, h.prototype.createEvents = function() {
            var t;
            this.events = {
                down: (t = this, function(e) {
                    return t.isBeingDragged = !0, t.offsetY = e.pageY - t.slider.offset().top, t.slider.is(e.target) || (t.offsetY = 0), t.pane.addClass(t.options.activeClass), t.doc.bind(u, t.events.drag).bind("mouseup", t.events.up), t.body.bind(o, t.events.enter), !1
                }),
                drag: function(t) {
                    return function(e) {
                        return t.sliderY = e.pageY - t.$el.offset().top - t.paneTop - (t.offsetY || .5 * t.sliderHeight), t.scroll(), t.contentScrollTop >= t.maxScrollTop && t.prevScrollTop !== t.maxScrollTop ? t.$el.trigger("scrollend") : 0 === t.contentScrollTop && 0 !== t.prevScrollTop && t.$el.trigger("scrolltop"), !1
                    }
                }(this),
                up: function(t) {
                    return function(e) {
                        return t.isBeingDragged = !1, t.pane.removeClass(t.options.activeClass), t.doc.unbind(u, t.events.drag).unbind("mouseup", t.events.up), t.body.unbind(o, t.events.enter), !1
                    }
                }(this),
                resize: function(t) {
                    return function(e) {
                        t.reset()
                    }
                }(this),
                panedown: function(t) {
                    return function(e) {
                        return t.sliderY = (e.offsetY || e.originalEvent.layerY) - .5 * t.sliderHeight, t.scroll(), t.events.down(e), !1
                    }
                }(this),
                scroll: function(t) {
                    return function(e) {
                        t.updateScrollValues(), t.isBeingDragged || (t.iOSNativeScrolling || (t.sliderY = t.sliderTop, t.setOnScrollStyles()), null != e && (t.contentScrollTop >= t.maxScrollTop ? (t.options.preventPageScrolling && t.preventScrolling(e, "down"), t.prevScrollTop !== t.maxScrollTop && t.$el.trigger("scrollend")) : 0 === t.contentScrollTop && (t.options.preventPageScrolling && t.preventScrolling(e, "up"), 0 !== t.prevScrollTop && t.$el.trigger("scrolltop"))))
                    }
                }(this),
                wheel: function(t) {
                    return function(e) {
                        var n;
                        if (null != e) return (n = e.delta || e.wheelDelta || e.originalEvent && e.originalEvent.wheelDelta || -e.detail || e.originalEvent && -e.originalEvent.detail) && (t.sliderY += -n / 3), t.scroll(), !1
                    }
                }(this),
                enter: function(t) {
                    return function(e) {
                        var n;
                        if (t.isBeingDragged) return 1 !== (e.buttons || e.which) ? (n = t.events).up.apply(n, arguments) : void 0
                    }
                }(this)
            }
        }, h.prototype.addEvents = function() {
            var t;
            this.removeEvents(), t = this.events, this.options.disableResize || this.win.bind(c, t[c]), this.iOSNativeScrolling || (this.slider.bind(r, t.down), this.pane.bind(r, t.panedown).bind(l + " " + a, t.wheel)), this.$content.bind(d + " " + l + " " + a + " " + p, t[d])
        }, h.prototype.removeEvents = function() {
            var t;
            t = this.events, this.win.unbind(c, t[c]), this.iOSNativeScrolling || (this.slider.unbind(), this.pane.unbind()), this.$content.unbind(d + " " + l + " " + a + " " + p, t[d])
        }, h.prototype.generate = function() {
            var t, n, i, a, r;
            return a = (n = this.options).paneClass, r = n.sliderClass, n.contentClass, (i = this.$el.children("." + a)).length || i.children("." + r).length || this.$el.append('<div class="' + a + '"><div class="' + r + '" /></div>'), this.pane = this.$el.children("." + a), this.slider = this.pane.find("." + r), 0 === s && k() ? t = {
                right: -14,
                paddingRight: +e.getComputedStyle(this.content, null).getPropertyValue("padding-right").replace(/[^0-9.]+/g, "") + 14
            } : s && (t = {
                right: -s
            }, this.$el.addClass(n.enabledClass)), null != t && this.$content.css(t), this
        }, h.prototype.restore = function() {
            this.stopped = !1, this.iOSNativeScrolling || this.pane.show(), this.addEvents()
        }, h.prototype.reset = function() {
            var t, e, n, a, r, o, u, l, h, c, p;
            return this.iOSNativeScrolling ? void(this.contentHeight = this.content.scrollHeight) : (this.$el.find("." + this.options.paneClass).length || this.generate().stop(), this.stopped && this.restore(), r = (a = (t = this.content).style).overflowY, i && this.$content.css({
                height: this.$content.height()
            }), e = t.scrollHeight + s, (h = parseInt(this.$el.css("max-height"), 10)) > 0 && (this.$el.height(""), this.$el.height(t.scrollHeight > h ? h : t.scrollHeight)), u = (o = this.pane.outerHeight(!1)) + (l = parseInt(this.pane.css("top"), 10)) + parseInt(this.pane.css("bottom"), 10), (p = Math.round(u / e * o)) < this.options.sliderMinHeight ? p = this.options.sliderMinHeight : null != this.options.sliderMaxHeight && p > this.options.sliderMaxHeight && (p = this.options.sliderMaxHeight), r === d && a.overflowX !== d && (p += s), this.maxSliderTop = u - p, this.contentHeight = e, this.paneHeight = o, this.paneOuterHeight = u, this.sliderHeight = p, this.paneTop = l, this.slider.height(p), this.events.scroll(), this.pane.show(), this.isActive = !0, t.scrollHeight === t.clientHeight || this.pane.outerHeight(!0) >= t.scrollHeight && r !== d ? (this.pane.hide(), this.isActive = !1) : this.el.clientHeight === t.scrollHeight && r === d ? this.slider.hide() : this.slider.show(), this.pane.css({
                opacity: this.options.alwaysVisible ? 1 : "",
                visibility: this.options.alwaysVisible ? "visible" : ""
            }), ("static" === (n = this.$content.css("position")) || "relative" === n) && (c = parseInt(this.$content.css("right"), 10)) && this.$content.css({
                right: "",
                marginRight: c
            }), this)
        }, h.prototype.scroll = function() {
            return this.isActive ? (this.sliderY = Math.max(0, this.sliderY), this.sliderY = Math.min(this.maxSliderTop, this.sliderY), this.$content.scrollTop(this.maxScrollTop * this.sliderY / this.maxSliderTop), this.iOSNativeScrolling || (this.updateScrollValues(), this.setOnScrollStyles()), this) : void 0
        }, h.prototype.scrollBottom = function(t) {
            return this.isActive ? (this.$content.scrollTop(this.contentHeight - this.$content.height() - t).trigger(l), this.stop().restore(), this) : void 0
        }, h.prototype.scrollTop = function(t) {
            return this.isActive ? (this.$content.scrollTop(+t).trigger(l), this.stop().restore(), this) : void 0
        }, h.prototype.scrollTo = function(t) {
            return this.isActive ? (this.scrollTop(this.$el.find(t).get(0).offsetTop), this) : void 0
        }, h.prototype.stop = function() {
            return f && this.scrollRAF && (f(this.scrollRAF), this.scrollRAF = null), this.stopped = !0, this.removeEvents(), this.iOSNativeScrolling || this.pane.hide(), this
        }, h.prototype.destroy = function() {
            return this.stopped || this.stop(), !this.iOSNativeScrolling && this.pane.length && this.pane.remove(), i && this.$content.height(""), this.$content.removeAttr("tabindex"), this.$el.hasClass(this.options.enabledClass) && (this.$el.removeClass(this.options.enabledClass), this.$content.css({
                right: ""
            })), this
        }, h.prototype.flash = function() {
            return !this.iOSNativeScrolling && this.isActive ? (this.reset(), this.pane.addClass(this.options.flashedClass), setTimeout((t = this, function() {
                t.pane.removeClass(t.options.flashedClass)
            }), this.options.flashDelay), this) : void 0;
            var t
        }, h
    }(), t.fn.nanoScroller = function(e) {
        return this.each(function() {
            var n, i;
            if ((i = this.nanoscroller) || (n = t.extend({}, v, e), this.nanoscroller = i = new h(this, n)), e && "object" == typeof e) {
                if (t.extend(i.options, e), null != e.scrollBottom) return i.scrollBottom(e.scrollBottom);
                if (null != e.scrollTop) return i.scrollTop(e.scrollTop);
                if (e.scrollTo) return i.scrollTo(e.scrollTo);
                if ("bottom" === e.scroll) return i.scrollBottom(0);
                if ("top" === e.scroll) return i.scrollTop(0);
                if (e.scroll && e.scroll instanceof t) return i.scrollTo(e.scroll);
                if (e.stop) return i.stop();
                if (e.destroy) return i.destroy();
                if (e.flash) return i.flash()
            }
            return i.reset()
        })
    }, t.fn.nanoScroller.Constructor = h
});
//     var Chat = {
//       _socket: null,
//       _host: "wss://mb.beeline.kz/",
//       _http_host: "https://mb.beeline.kz/",
//       _lang: null,
//       _started: !1,
//       _messagesStack: [],
//       _visible: !1,
//       _TYPE_USER: 1,
//       _TYPE_BOT: 2,
//       _TYPE_INFO: 3,
//       _botName: "DANA",
//       _isAutheticated: !1,
//       _msisdn: null,
//       _loading: !1,
//       init: function (t) {
//           if ("object" != typeof t || !t.lang) throw new TypeError("Неверный параметр!");
//           t.botName && (this._botName = "BOT" == t.botName ? "DANA" : t.botName),
//               t.lang && ((t.lang = t.lang.toUpperCase()), (this._lang = t.lang)),
//               window.$ && $.support && ($.support.cors = !0),
//               t.host && (this._host = t.host),
//               t.http_host && (this._http_host = t.http_host),
//               Character.init(t),
//               this.loadState(),
//               this._started && !this._visible && this.openSocket();
//       },
//       openSocket: function (t) {
//           if (this._socket && this._socket.readyState == this._socket.OPEN) return !0;
//           (this._socket = new WebSocket(this._host + "chat")),
//               this._socket.addEventListener("open", function (e) {
//                   console.info("Connected!"), "function" == typeof t && t();
//               }),
//               this._socket.addEventListener("message", this.onMessage),
//               this._socket.addEventListener("close", function (t) {
//                   console.info("Connection closed!"),
//                       Chat._started &&
//                           Chat._visible &&
//                           setTimeout(function () {
//                               Chat.openSocket();
//                           }, 3e3);
//               });
//       },
//       startConnection: function (t, e, n, i, s, a) {
//           if (($("#input-message").focus(), $("#input-message").prop("disabled", !1), this._started)) return this._socket || this.openSocket(), !0;
//           this._started = !0;
//           const r = this._lang ? this._lang.toLowerCase() : "";
//           var o = this._http_host + "web/initialize?bot=" + this._botName + "&channel=web&lang=" + r,
//               u = { action: "initialize", lang: r, channel: "web" };
//           e && i ? ((u.schemaId = e), (u.stepId = n), (u.buttonId = i), (o += "&schemaId=" + e + "&buttonId=" + i)) : t ? ((u.question = t), (o += "&question=" + t)) : !0 === s && (o += "&greet=false"),
//               this.doRequest(o, {
//                   dataType: "json",
//                   callback: function (t) {
//                       t.success ? (Chat._socket || Chat.openSocket(), t.responses && Chat.appendMachineMessage(t.responses), "function" == typeof a && a(t)) : Chat.appendError("Ошибка при запросе! Пожалуйста попробуйте позже.");
//                   },
//               });
//       },
//       doRequest: function (t, e) {
//           "object" != typeof e && (e = {}),
//               $.ajax({
//                   url: t,
//                   type: e.type ? e.type : "get",
//                   dataType: e.dataType ? e.dataType : "html",
//                   data: e.data ? e.data : null,
//                   xhrFields: { withCredentials: !0 },
//                   contentType: e.contentType ? e.contentType : null,
//                   beforeSend: function (t) {
//                       "function" == typeof e.beforeSend && e.beforeSend(t);
//                   },
//                   crossDomain: !0,
//                   success: function (t) {
//                       "function" == typeof e.callback && e.callback(t);
//                   },
//                   error: function (t) {
//                       "function" == typeof e.error && e.error(t);
//                   },
//                   complete: function (t) {
//                       "function" == typeof e.complete && e.complete(t);
//                   },
//               });
//       },
//       onMessage: function (t) {
//           var e = JSON.parse(t.data);
//           if ((e.responses && (Chat._visible || Chat.open(), Chat.appendMachineMessage(e.responses)), "DIALOG_NOT_FOUND" == e.error || "SESSION_EXPIRED" == e.error))
//               return (Chat._started = !1), void (e.question ? Chat.startConnection(e.question) : Chat.startConnection(null, e.schemaId, e.stepId, e.buttonId));
//           "checkSmsCode" == e.step &&
//               (e.success ? ($(".chat-auth-block").hide(), Chat.startDialog(), e.account && Chat.showAuthStatusBlock(e.account)) : e.message && $("#accountErrorMsg").text(e.message),
//               "AUTH_ATTEMPTS_EXPIRED" === e.status &&
//                   setTimeout(function () {
//                       Chat.showIntroPage();
//                   }, 1e3)),
//               Chat.saveState();
//       },
//       sendData: function (t) {
//           if (!this._socket)
//               return (
//                   console.error("socket not opened yet!"),
//                   this.openSocket(function () {
//                       Chat.sendData(t);
//                   }),
//                   !1
//               );
//           this._socket.readyState != this._socket.CONNECTING
//               ? this._socket.readyState == this._socket.OPEN
//                   ? this._socket.send(JSON.stringify(t))
//                   : (console.error("socket is closed!"),
//                     this.openSocket(function () {
//                         Chat.sendData(t);
//                     }))
//               : setTimeout(function () {
//                     Chat.sendData(t);
//                 }, 500);
//       },
//       sendMessage: function () {
//           this.sendMsg($("#input-message").val() + ""), $("#input-message").val(""), $(window).trigger("resize");
//       },
//       sendMsg: function (t) {
//           "" != (t = $.trim(t)) && (this.appendUsersMessage(t), this.sendData({ question: t, action: "question" }), $(window).trigger("resize"), this.hidePredictList());
//       },
//       buttonClick: function (t) {
//           t = $(t);
//           var e = $.trim(t.text() + "");
//           "" != e && (t.attr("href") || Chat.appendUsersMessage(e), Chat.sendData({ action: "buttonClick", schemaId: t.attr("sch-id"), stepId: t.attr("step-id"), buttonId: t.attr("btn-id") }), $(window).trigger("resize"));
//       },
//       appendMachineMessage: function (t) {
//           var e, n;
//           $(".typingBubble").remove();
//           try {
//               for (var i in t) {
//                   var s = t[i];
//                   (e = ""),
//                       (n = ""),
//                       Chat._isAutheticated && !1 === s.is_authorized && ((Chat._isAutheticated = !1), $("#chatUserPanel").hide()),
//                       s.ctn && "yes" == s.authorized && Chat.showAuthStatusBlock(s.ctn),
//                       s.buttons &&
//                           ((e = '<ul class="chat-response-options">'),
//                           s.buttons.forEach(function (t) {
//                               t.url
//                                   ? (e +=
//                                         '<li class="userlink"><a href="' +
//                                         t.url +
//                                         '" sch-id="' +
//                                         t.schemaId +
//                                         '" step-id="' +
//                                         t.stepId +
//                                         '" btn-id="' +
//                                         t.buttonId +
//                                         '" ' +
//                                         (t.targetBlank ? 'target="_blank"' : "") +
//                                         ">" +
//                                         t.name +
//                                         "</a></li>")
//                                   : (e += '<li class="userlink" sch-id="' + t.schemaId + '" step-id="' + t.stepId + '" btn-id="' + t.buttonId + '" onclick="Chat.buttonClick(this)">' + t.name + "</li>");
//                           }),
//                           (e += "</ul>")),
//                       s.file && (n = '<div class="chat-attached-file"><a href="' + s.file.url + '" target="_blank">' + s.file.name + "</a></div>"),
//                       (s.response = this.renderMessage(s.response)),
//                       this.appendBotMessage(s.response + n + e);
//               }
//               this.saveState();
//           } catch (t) {
//               console.error(t);
//           }
//       },
//       appendIframe: function (t) {
//           this.append('<div class="answerBubble"><div class="message iframe-msg"><div class="chatbot-iframe-msg-info">' + t.question + '</div><iframe src="' + t.iframe + '"></iframe></div></div>'),
//               this.addMessageToStack(t.question, this._TYPE_BOT, t.iframe);
//       },
//       appendUsersMessage: function (t) {
//           var e = document.createElement("div");
//           e.classList.add("userBubble");
//           var n = document.createElement("div");
//           n.classList.add("message"), (n.innerText = t), e.appendChild(n), this.addMessageToStack(t, this._TYPE_USER), this.append(e);
//       },
//       appendBotMessage: function (t) {
//           this.append('<div class="answerBubble"><div class="message">' + t + "</div></div>"), this.addMessageToStack(t, this._TYPE_BOT);
//       },
//       appendInfo: function (t) {
//           this.addMessageToStack(t, this._TYPE_INFO), this.append('<div class="infoBubble"><div class="message">' + t + "</div></div>");
//       },
//       appendError: function (t) {
//           Chat.append('<div class="errorBubble"><div class="message">' + t + "</div></div>");
//       },
//       append: function (t) {
//           $(".messageBox").append(t), this.scrollDown();
//       },
//       scrollDown: function () {
//           $(".messageBox")[0].scrollTop = $(".messageBox")[0].scrollHeight;
//       },
//       removeIllegalChars: function (t) {
//           return (t = t.toLowerCase()), $.isNumeric(t.replace(new RegExp(" ", "g"), "")) && (t = t.replace(new RegExp(" ", "g"), "")), t;
//       },
//       getCookie: function (t) {
//           var e = document.cookie.match(new RegExp("(?:^|; )" + t.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
//           return e ? decodeURIComponent(e[1]) : void 0;
//       },
//       setCookie: function (t, e, n) {
//           var i = (n = n || {}).expires;
//           if ("number" == typeof i && i) {
//               var s = new Date();
//               s.setTime(s.getTime() + 1e3 * i), (i = n.expires = s);
//           }
//           i && i.toUTCString && (n.expires = i.toUTCString());
//           var a = t + "=" + (e = encodeURIComponent(e));
//           for (var r in n) {
//               (a += "; " + r), (a += "=" + n[r]);
//           }
//           document.cookie = a;
//       },
//       renderMessage: function (t) {
//           return t;
//       },
//       addMessageToStack: function (t, e, n) {
//           var i = { m: t, t: e };
//           n && (i.ifrm = n), this._messagesStack.push(i), (this._messagesStack = this._messagesStack.splice(-10));
//       },
//       saveState: function () {
//           if (!JSON) return !1;
//           var t = { _msisdn: this._msisdn, _isAutheticated: this._isAutheticated, _started: this._started, _visible: this._visible, _lang: this._lang };
//           if ((this._authToken && (t._authToken = this._authToken), this.setCookie("_chat", JSON.stringify(t), { path: "/" }), "undefined" == typeof Storage)) return !1;
//           localStorage.chatMessages = JSON.stringify(this._messagesStack);
//       },
//       loadState: function () {
//           var t = this.getCookie("_chat");
//           if (!t) return !1;
//           for (var e in (t = JSON.parse(t))) this[e] = t[e];
//           this.loadMessagesFromStorage(), this._visible && this.open(), this._isAutheticated && this._msisdn && this.showAuthStatusBlock(this._msisdn);
//       },
//       loadMessagesFromStorage: function () {
//           if ("undefined" == typeof Storage) return !1;
//           var t = localStorage.getItem("chatMessages");
//           if (!t) return !1;
//           t = JSON.parse(t);
//           for (var e = 0; e < t.length; e++) {
//               var n = t[e];
//               n.t == this._TYPE_INFO ? this.appendInfo(n.m) : n.t == this._TYPE_USER ? this.appendUsersMessage(n.m) : n.t == this._TYPE_BOT && this.appendBotMessage(n.m);
//           }
//           setTimeout(function () {
//               Chat.scrollDown(), $(window).trigger("resize");
//           }, 100);
//       },
//       startDialog: function () {
//           this._msisdn && this.showAuthStatusBlock(this._msisdn), $(".chatBox").removeClass("intro"), Chat.startConnection(), this.saveState();
//       },
//       open: function () {
//           Character.setDefault(),
//               $(".chatBox").show(),
//               $(".chatBox").css("display", "block"),
//               $("#chat-open-button").hide(),
//               (Chat._visible = !0),
//               this._authToken
//                   ? this._started
//                       ? (this.openSocket(), Chat.authorizeByToken(!0))
//                       : Chat.startConnection(null, null, null, null, !0, function () {
//                             Chat.authorizeByToken(!0);
//                         })
//                   : this._started
//                   ? Chat.startConnection()
//                   : ($(".chatBox").addClass("intro"), Chat.detectMsisdn());
//       },
//       close: function () {
//           $(".chatBox").hide(), $("#chat-open-button").show(), (Chat._dialogEnded = !0), (Chat._visible = !1);
//       },
//       loginSubmit: function () {
//           var t = $(".chatBox #msisdn")
//                   .val()
//                   .replace(/[^\d]+/g, ""),
//               e = $(".chatBox #msisdnPass").val();
//           $("#accountErrorMsg").text(""), 0 !== t.indexOf("1") && 0 !== t.indexOf("0") ? (11 == t.length && e.length >= 4 ? this.checkPass() : 11 != t.length || "" != e || this.sendSMS()) : this.authorizeWithLogin(t);
//       },
//       authorizeWithLogin(t, e) {
//           var n = { bot: this._botName, login: t, channel: "web", lang: this._lang, step: e ? "authByLogin" : "checkLogin" };
//           !0 !== this.__web_auth &&
//               ((this.__web_auth = !0),
//               this.doRequest(this._http_host + "web/auth", {
//                   data: n,
//                   dataType: "json",
//                   callback: function (t) {
//                       t.success
//                           ? (Chat.openSocket(),
//                             $(".chatBox #accountInfo").html(t.customer.name + "<br />" + t.customer.address),
//                             $(".chatBox .account-confirm-block").show(),
//                             $(".chatBox #msisdn, .chatBox .auth-send-buttons").hide(),
//                             t.account && ($(".chat-auth-block").hide(), Chat.startDialog(), Chat.showAuthStatusBlock(t.account)))
//                           : "KZ" == Chat._lang
//                           ? $("#accountErrorMsg").text("Логин табылмады!")
//                           : $("#accountErrorMsg").text("Логин не найден!");
//                   },
//                   error: function () {
//                       "KZ" == Chat._lang ? $("#accountErrorMsg").text("Қате орын алды!") : $("#accountErrorMsg").text("Произошла ошибка!");
//                   },
//                   complete: function () {
//                       Chat.__web_auth = !1;
//                   },
//               }));
//       },
//       authorizeWithLoginConfirmed() {
//           var t = $(".chatBox #msisdn")
//               .val()
//               .replace(/[^\d]+/g, "");
//           this.authorizeWithLogin(t, !0);
//       },
//       sendSMS: function () {
//           var t = $(".msisdnField")
//               .val()
//               .replace(/(\+|\(|\)|-)/g, "");
//           t.length > 10 && (t = t.substr(t.length - 10)), (this._authNumber = t);
//           var e = { bot: this._botName, ctn: t, channel: "web", lang: this._lang, step: "requestNumber" };
//           $("#accountErrorMsg").text(""),
//               !0 !== this.__web_auth &&
//                   ((this.__web_auth = !0),
//                   this.doRequest(this._http_host + "web/auth", {
//                       data: e,
//                       dataType: "json",
//                       callback: function (t) {
//                           t.success ? (Chat.openSocket(), $(".chatBox .code-block").show(), $(".chatBox #msisdnPass").focus(), $(".chatBox #msisdn").hide()) : t.message && $("#accountErrorMsg").text(t.message);
//                       },
//                       error: function () {
//                           "KZ" == Chat._lang ? $("#accountErrorMsg").text("Қате орын алды!") : $("#accountErrorMsg").text("Произошла ошибка!");
//                       },
//                       complete: function () {
//                           Chat.__web_auth = !1;
//                       },
//                   }));
//       },
//       checkPass: function () {
//           var t = this._authNumber,
//               e = $("#msisdnPass").val(),
//               n = function () {
//                   Chat.sendData({ action: "checkAuthCode", bot: Chat._botName, ctn: t, smsCode: e, channel: "web", lang: Chat._lang, step: "checkSmsCode" });
//               };
//           this._socket ? n() : this.openSocket(n);
//       },
//       logout: function () {
//           return (
//               (this._authToken = null),
//               new Promise(function (t, e) {
//                   Chat._msisdn
//                       ? Chat.doRequest(Chat._http_host + "web/logout", {
//                             method: "GET",
//                             dataType: "json",
//                             callback: function (e) {
//                                 if ((t(), e.success)) {
//                                     $("#chatUserPanel").hide();
//                                     var n = "Вы успешно разлогинились!";
//                                     "KZ" == Chat._lang && (n = "Сіз жүйеден сәтті шықтыңыз!"),
//                                         Chat.append('<div class="infoBubble"><div class="message">' + n + "</div></div>"),
//                                         Chat.showIntroPage(),
//                                         (Chat._msisdn = null),
//                                         (Chat._messagesStack = []),
//                                         (Chat._socket = null);
//                                 }
//                                 Chat.saveState();
//                             },
//                             error: function () {
//                                 e();
//                             },
//                         })
//                       : t();
//               })
//           );
//       },
//       showAuthStatusBlock: function (t) {
//           if (t) {
//               if (((this._isAutheticated = !0), (this._msisdn = t), 0 === t.indexOf("0") || 0 === t.indexOf("1"))) var e = t.replace(/(\d{3})(\d{7})/, "$1 $2");
//               else e = (e = "7" + t).replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, "+$1 $2 $3 $4 $5");
//               $("#chatUserPanel span").text(e), $("#chatUserPanel").show();
//           }
//       },
//       setLoading: function (t) {
//           if (((this._loading = !1 !== t), $(".chat-bot-loading").remove(), $("#input-message").prop("disabled", !1), 0 != this._loading)) {
//               $("#input-message").prop("disabled", !0);
//               var e = "KZ" == this._lang ? "Күте тұрыңыз" : "Подождите пожалуйста";
//               this.append('<div class="chat-bot-loading"><div class="chat-bot-loading-message">' + e + '</div><div class="chat-bot-loading-icon"></div></div>');
//           }
//       },
//       showIntroPage: function () {
//           $(".chat-auth-block").show(),
//               $(".chatBox").addClass("intro"),
//               $("#msisdn").show(),
//               $("#msisdn").val(""),
//               $(".chatBox .code-block").hide(),
//               $("#msisdnPass").val(""),
//               $(".chatBox .account-confirm-block").hide(),
//               $(".chatBox #msisdn, .chatBox .auth-send-buttons").show(),
//               $("#accountErrorMsg").text(""),
//               $(".chatBox .messages-block .messageBox").html(""),
//               (this._started = !1);
//       },
//       setNumberFromHE: function (t) {
//           (t += "").length > 10 && (t = t.substr(t.length - 10));
//           var e = t;
//           10 == e.length && (e = t.replace(/^(\d\d\d)(\d\d\d)(\d\d)(\d\d)$/g, "+7($1)$2-$3-$4")), (Chat._msisdn = t), Chat.setCookie("_chatUserNumber", t, { domain: ".beeline.kz" }), $(".chatBox #msisdn").val(e);
//       },
//       detectMsisdn: function () {
//           if (this._msisdn) return;
//           let t = document.createElement("img");
//           (t.src = "http://beeline.kz/restservices/header/enrichment/my-beeline-number"),
//               (t.onload = function () {
//                   Chat.doRequest("https://beeline.kz/restservices/header/enrichment/my-number", {
//                       dataType: "json",
//                       callback: function (t) {
//                           Chat.setNumberFromHE(t.account);
//                       },
//                   });
//               }),
//               (t.onerror = function () {}),
//               document.getElementsByTagName("body")[0].appendChild(t);
//       },
//       authByToken: function () {
//           return new Promise(function (t, e) {
//               Chat.doRequest("/restservices/telco/auth/session", {
//                   method: "GET",
//                   dataType: "json",
//                   callback: function (e) {
//                       if (e.username) {
//                           if (Chat._msisdn && Chat._msisdn != e.username) return void t();
//                           (Chat._authToken = e), Chat.saveState();
//                       }
//                       t();
//                   },
//                   error: function (t) {
//                       e(t);
//                   },
//               });
//           });
//       },
//       authorizeByToken: function (t) {
//           Chat._authToken &&
//               Chat._started &&
//               ((Chat._msisdn && Chat._msisdn != Chat._authToken.username) ||
//                   (Chat.doRequest(Chat._http_host + "web/authorize_by_token", {
//                       type: "POST",
//                       dataType: "json",
//                       data: JSON.stringify(Chat._authToken),
//                       contentType: "application/json; charset=utf-8",
//                       callback: function (e) {
//                           e.success && e.account && ($(".chat-auth-block").hide(), Chat.showAuthStatusBlock(e.account), t && (Chat.startDialog(), Chat.sendData({ action: "greeting" })), Chat.saveState());
//                       },
//                   }),
//                   (Chat._authToken = null)));
//       },
//       getPredict: function (t) {
//           if (!(t = $.trim(t + "")) || t.length <= 2) return this.hidePredictList(), !1;
//           "" != $("#input-message").val() &&
//               this.doRequest(this._http_host + "web/predict", {
//                   type: "POST",
//                   dataType: "json",
//                   contentType: "application/json; charset=utf-8",
//                   data: JSON.stringify({ botCode: this._botName, lang: this._lang.toLowerCase(), query: t }),
//                   callback: function (t) {
//                       "" != $("#input-message").val() && Chat.renderPrediction(t.results);
//                   },
//               });
//       },
//       renderPrediction: function (t) {
//           if (($("#chatPredictList").hide(), 0 != t.length)) {
//               var e,
//                   n,
//                   i = "";
//               for (var s in t) t[s].responseId ? ((e = "respid"), (n = t[s].responseId)) : ((e = "schid"), (n = t[s].schemaId)), (i += "<li " + e + '="' + n + '" onclick="Chat.predictionClick($(this))">' + t[s].title + "</li>");
//               $("#chatPredictList").html(i).show(), (this.predictionListShown = !0);
//           }
//       },
//       hidePredictList: function () {
//           $("#chatPredictList").hide(), (this.predictionListShown = !1);
//       },
//       predictListControl: function (t) {
//           if (-1 == ["Enter", "ArrowUp", "ArrowDown"].indexOf(t) || !this.predictionListShown) return !0;
//           var e = $("#chatPredictList li.selected");
//           if ("Enter" == t) {
//               if (0 == e.length) return !0;
//               Chat.predictionClick(e), $("#input-message").val("");
//           } else
//               "ArrowUp" == t
//                   ? 0 == e.length
//                       ? $("#chatPredictList li:last-child").addClass("selected")
//                       : (e.removeClass("selected"), e.prev().addClass("selected"))
//                   : "ArrowDown" == t && (0 == e.length ? $("#chatPredictList li:first").addClass("selected") : (e.removeClass("selected"), e.next().addClass("selected")));
//           return !1;
//       },
//       predictionClick: function (t) {
//           var e = { action: "getResponseById" };
//           t.attr("respid") ? (e.responseId = t.attr("respid")) : (e.schemaId = t.attr("schid")), this.sendData(e), this.appendUsersMessage(t.text()), $(window).trigger("resize"), this.hidePredictList(), $("#input-message").val("");
//       },
//   },
//   Character = {
//       _default: "anim_0.gif",
//       _host: "/",
//       _path: "/binaries/content/assets/chat-bot/images/dana/",
//       _moves: ["anim_1.gif", "anim_2.gif", "anim_3.gif", "anim_4.gif"],
//       _lastMoveIndex: null,
//       _firstOpen: !0,
//       _version: "20210827-119",
//       _styleSheetFile: "/binaries/content/assets/chat-bot/css/chat.min.css",
//       _actions: { eye: "anim_5.gif", smile: "anim_6.gif", think: "anim_7.gif", look_down: "anim_8.gif", no: "anim_9.gif" },
//       init: function (t) {
//           "localhost:8000" == location.host
//               ? (this._path = "./images/dana/")
//               : ["mb.beeline.kz", "mb-dev.beeline.kz", "mb-test.beeline.kz", "localhost:9023"].indexOf(location.host) >= 0 && ((this._styleSheetFile = "../../../../assets/css/chat.css"), (this._path = "/web/static/images/dana/")),
//               this.addOpenButton(),
//               this.embedChat(),
//               this.bindListeners(),
//               setTimeout(function () {
//                   Character.startAnimation();
//               }, 1e3);
//       },
//       addStylesheet: function () {
//           location.host.indexOf("localhost") >= 0 && (this._styleSheetFile = "../../../../assets/css/chat.css"),
//               ["mb.beeline.kz", "mb-dev.beeline.kz", "mb-test.beeline.kz", "localhost:9023"].indexOf(location.host) >= 0 && ((this._styleSheetFile = "../../../../assets/css/chat.css"), (this._path = "/web/static/images/dana/")),
//               $("head").append('<link rel="stylesheet" media="all" href="' + this._styleSheetFile + "?" + this._version + '" />');
//       },
//       startAnimation: function () {
//           var t = this;
//           this._inteval = setInterval(function () {
//               if (t._animating || !Chat._visible) return !1;
//               t.move();
//           }, 3e4);
//       },
//       move: function () {
//           var t = this.getMoveIndex();
//           if (!this._moves[t]) return !1;
//           var e = this._path + this._moves[t];
//           this.setAnimation(e);
//       },
//       action: function (t) {
//           if (!this._actions[t]) return !1;
//           if (this._animating)
//               return (
//                   setTimeout(function () {
//                       Character.action(t);
//                   }, 1e3),
//                   !1
//               );
//           var e = this._path + this._actions[t];
//           this.setAnimation(e);
//       },
//       setAnimation: function (t) {
//           $(".character-img").attr("src", t + "?v=" + this._version),
//               (this._animating = !0),
//               setTimeout(function () {
//                   Character.setDefault(), (Character._animating = !1);
//               }, 4e3);
//       },
//       getMoveIndex: function () {
//           var t = Math.round(Math.random() * this._moves.length);
//           return t == this._lastMoveIndex ? this.getMoveIndex() : ((this._lastMoveIndex = t), t);
//       },
//       setDefault: function () {
//           $(".character-img").attr("src", this._path + this._default + "?v=" + this._version);
//       },
//       addOpenButton: function () {
//           var t = "KZ" == Chat._lang ? "Виртуалды кеңесші" : "Виртуальный консультант";
//           $("body").append('<div id="chat-open-button" class="beeline">\t\t\t<div class="chat-consultant">' + t + "</div>\t\t</div>");
//       },
//       embedChat: function () {
//           var t = "Введите Ваш вопрос",
//               e = "Виртуальный консультант",
//               n = "Получите персонализированные ответы на свои вопросы на сайте или в мессенджере",
//               i = "Написать в телеграм",
//               s = "Написать в facebook",
//               a = "Написать в whatsapp",
//               r = 'Продолжить <a href="#" class="start-dialog">без авторизации</a>',
//               o = "Выход",
//               u = "Номер телефона или логин",
//               l = "Подтверждаете?",
//               h = "Введите код",
//               c = "На Ваш номер отправлен СМС с кодом",
//               d = "Отправить",
//               p = "Да",
//               f = "Нет";
//           "KZ" == Chat._lang &&
//               ((t = "Сұрағыңызды енгізіңіз"),
//               (e = "Виртуальный консультант"),
//               (n = "Сұрағыңызға жекешелендірілген жауапты сайтта немесе мессенджерде ала аласыз"),
//               "Telegram-да",
//               "Facebook-та",
//               "XXXX нөміріне SMS жіберу (тегін)",
//               (r = '<a href="#" class="start-dialog">Авторизациясыз жалғастыру</a>'),
//               (i = "Telegram-да жазу"),
//               (s = "Facebook-та жазу"),
//               (a = "Whatsapp-та жазу"),
//               "XXXX нөміріне SMS жіберіп (тегін)",
//               (o = "Шығу"),
//               (u = "Нөміріңізді/логиніңізді енгізіңіз"),
//               (l = "Растайсыз ба?"),
//               (h = "Кодты енгізіңіз"),
//               (c = "Нөміріңізге коды бар SMS жіберілді"),
//               (d = "Жіберу"),
//               (p = "Да"),
//               (f = "Нет")),
//               $("body").append(
//                   '<div class="chatBox">                <div class="ui-icon ui-icon-closethick" id="close"></div>                <div id="chatUserPanel"><i></i> <span class="chat-user-number"></span> <a href="#" title="' +
//                       o +
//                       '"></a></div>                <div class="chat-box-intro-links">                <h3>' +
//                       e +
//                       '</h3>                 <p class="int-text">' +
//                       n +
//                       '</p>                 <ul>                    <li class="chat-auth-block int-text">                        <input id="msisdn" class="chatbot-input-field msisdnField" placeholder="' +
//                       u +
//                       '" autocomplete="off" /><br />                        <div class="code-block" style="display:none">                            <input id="msisdnPass" class="chatbot-input-field msisdnPass" type="password" placeholder="' +
//                       h +
//                       '" autocomplete="off" />                             <span class="chat-bot-small-text">' +
//                       c +
//                       '</span>                        </div>                        <div id="accountErrorMsg" class="chat-bot-small-text chat-bot-error-text"></div>                        <div class="account-confirm-block" style="display:none">                            <div id="accountInfo"></div>                            <span>' +
//                       l +
//                       '</span>                            <div class="auth-confirm-buttons">                                 <input type="button" value="' +
//                       p +
//                       '" onclick="Chat.authorizeWithLoginConfirmed()" class="chatbot-btn" />                                <input type="button" value="' +
//                       f +
//                       '" onclick="Chat.showIntroPage()" class="chatbot-btn chatbot-btn-default" />                            </div>                         </div>                        <div class="auth-send-buttons"><input type="button" value="' +
//                       d +
//                       '" onclick="Chat.loginSubmit()" class="chatbot-btn" /></div>                         <div class="int-text continue-without-auth">' +
//                       r +
//                       '<div>                    </li>                    <li class="bot-links">                    <a href="https://t.me/BeelineDanaBot" target="_blank" class="telegram-link" title="' +
//                       i +
//                       '"><i class="telegram-bot-link"></i> <span class="int-text">' +
//                       i +
//                       '</span></a>                    <a href="https://wa.me/77713330055" target="_blank" title="' +
//                       a +
//                       '"><i class="whatsapp-bot-link"></i> <span class="int-text">' +
//                       a +
//                       '</span></a>                    \x3c!--a href="https://www.facebook.com/Beeline.Kazakhstan/app/190322544333196/?ref=page_internal" target="_blank" title="' +
//                       s +
//                       '"><i class="facebook-bot-link"></i> <span class="int-text">' +
//                       s +
//                       '</span></a--\x3e                    </li>                 </ul>                </div>                <div class="character-block"><img class="character-img" src="">\t\t\t</div>                <div class="dialog-block">                    <div class="messages-block">                        <div class="nano">                            <div class="messageBox nano-content"></div>                        </div>                    </div>                    <div class="request-form">                        <ul id="chatPredictList" class="chat-prediction-block" style="display:none"></ul>                        <input name="input-message" id="input-message" type="text" placeholder="' +
//                       t +
//                       '" maxlength="100" disabled />                        <input type="button" class="send-button" value=" " />                    </div>                </div>            </div>'
//               ),
//               "undefined" != typeof IMask &&
//                   (this.numberMask = new IMask(document.getElementById("msisdn"), {
//                       mask: [{ mask: "\\000 0000000", startsWith: "0" }, { mask: "100 0000000", startsWith: "1" }, { mask: "+{7}(700)000-00-00" }],
//                       dispatch: function (t, e) {
//                           var n = (e.value + t).replace(/\D/g, "");
//                           return e.compiledMasks.find(function (t) {
//                               return !t.startsWith || 0 === n.indexOf(t.startsWith);
//                           });
//                       },
//                   })),
//               $("#msisdn").change(function (t) {
//                   $("#msisdnPass").val("");
//               });
//       },
//       bindListeners: function () {
//           var t;
//           $("#chatUserPanel a").click(function () {
//               return Chat.logout(), !1;
//           }),
//               $("#chat-open-button").click(function () {
//                   return Chat.open(), Chat.saveState(), !1;
//               }),
//               $("#close").click(function () {
//                   return Chat.close(), Chat.saveState(), !1;
//               }),
//               $("#input-message").keypress(function (t) {
//                   13 == t.which && Chat.sendMessage();
//               }),
//               $(".request-form .send-button").click(function () {
//                   if (Chat._loading) return !1;
//                   Chat.sendMessage();
//               }),
//               $(".chatBox .start-dialog").click(function () {
//                   return $(".chat-auth-block").hide(), Chat.startDialog(), !1;
//               }),
//               $("#msisdn").keypress(function (t) {
//                   13 == t.which && Chat.loginSubmit();
//               }),
//               $(".chatBox .enterNumber").click(function () {}),
//               $("#msisdnPass").keypress(function (t) {
//                   13 == t.which && Chat.checkPass();
//               });
//           var e = function (e) {
//               clearTimeout(t),
//                   (t = setTimeout(function () {
//                       Chat.getPredict(e);
//                   }, 750));
//           };
//           if (
//               ($("#input-message").on("input", function (t) {
//                   e(t.currentTarget.value);
//               }),
//               $("#input-message").keyup(function (t) {
//                   "Backspace" == t.key && ("" == this.value ? Chat.hidePredictList() : e(t.currentTarget.value));
//               }),
//               $("#input-message").keydown(function (t) {
//                   return Chat.predictListControl(t.key);
//               }),
//               $().nanoScroller)
//           )
//               $(".chatBox .nano").nanoScroller({ alwaysVisible: !0 }), $(".chatBox .nano-content").css("right", 0);
//           else {
//               var n = $(".dialog-block .messageBox");
//               n.removeClass("nano-content"), n.css({ "overflow-y": "auto", height: "inherit" });
//           }
//       },
//   };
//   Character.addStylesheet(),
//   (function (t, e) {
//       "object" == typeof exports && "undefined" != typeof module ? e(exports) : "function" == typeof define && define.amd ? define(["exports"], e) : e(((t = t || self).IMask = {}));
//   })(this, function (t) {
//       "use strict";
//       var e = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};
//       function n(t, e) {
//           return t((e = { exports: {} }), e.exports), e.exports;
//       }
//       var i = function (t) {
//               return t && t.Math == Math && t;
//           },
//           s = i("object" == typeof globalThis && globalThis) || i("object" == typeof window && window) || i("object" == typeof self && self) || i("object" == typeof e && e) || Function("return this")(),
//           a = function (t) {
//               try {
//                   return !!t();
//               } catch (t) {
//                   return !0;
//               }
//           },
//           r = !a(function () {
//               return (
//                   7 !=
//                   Object.defineProperty({}, "a", {
//                       get: function () {
//                           return 7;
//                       },
//                   }).a
//               );
//           }),
//           o = {}.propertyIsEnumerable,
//           u = Object.getOwnPropertyDescriptor,
//           l = {
//               f:
//                   u && !o.call({ 1: 2 }, 1)
//                       ? function (t) {
//                             var e = u(this, t);
//                             return !!e && e.enumerable;
//                         }
//                       : o,
//           },
//           h = function (t, e) {
//               return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: e };
//           },
//           c = {}.toString,
//           d = "".split,
//           p = a(function () {
//               return !Object("z").propertyIsEnumerable(0);
//           })
//               ? function (t) {
//                     return "String" ==
//                         (function (t) {
//                             return c.call(t).slice(8, -1);
//                         })(t)
//                         ? d.call(t, "")
//                         : Object(t);
//                 }
//               : Object,
//           f = function (t) {
//               if (null == t) throw TypeError("Can't call method on " + t);
//               return t;
//           },
//           v = function (t) {
//               return p(f(t));
//           },
//           g = function (t) {
//               return "object" == typeof t ? null !== t : "function" == typeof t;
//           },
//           m = function (t, e) {
//               if (!g(t)) return t;
//               var n, i;
//               if (e && "function" == typeof (n = t.toString) && !g((i = n.call(t)))) return i;
//               if ("function" == typeof (n = t.valueOf) && !g((i = n.call(t)))) return i;
//               if (!e && "function" == typeof (n = t.toString) && !g((i = n.call(t)))) return i;
//               throw TypeError("Can't convert object to primitive value");
//           },
//           k = {}.hasOwnProperty,
//           _ = function (t, e) {
//               return k.call(t, e);
//           },
//           y = s.document,
//           b = g(y) && g(y.createElement),
//           C =
//               !r &&
//               !a(function () {
//                   return (
//                       7 !=
//                       Object.defineProperty(((t = "div"), b ? y.createElement(t) : {}), "a", {
//                           get: function () {
//                               return 7;
//                           },
//                       }).a
//                   );
//                   var t;
//               }),
//           S = Object.getOwnPropertyDescriptor,
//           E = {
//               f: r
//                   ? S
//                   : function (t, e) {
//                         if (((t = v(t)), (e = m(e, !0)), C))
//                             try {
//                                 return S(t, e);
//                             } catch (t) {}
//                         if (_(t, e)) return h(!l.f.call(t, e), t[e]);
//                     },
//           },
//           A = function (t) {
//               if (!g(t)) throw TypeError(String(t) + " is not an object");
//               return t;
//           },
//           F = Object.defineProperty,
//           w = {
//               f: r
//                   ? F
//                   : function (t, e, n) {
//                         if ((A(t), (e = m(e, !0)), A(n), C))
//                             try {
//                                 return F(t, e, n);
//                             } catch (t) {}
//                         if ("get" in n || "set" in n) throw TypeError("Accessors not supported");
//                         return "value" in n && (t[e] = n.value), t;
//                     },
//           },
//           T = r
//               ? function (t, e, n) {
//                     return w.f(t, e, h(1, n));
//                 }
//               : function (t, e, n) {
//                     return (t[e] = n), t;
//                 },
//           x = function (t, e) {
//               try {
//                   T(s, t, e);
//               } catch (n) {
//                   s[t] = e;
//               }
//               return e;
//           },
//           B = s["__core-js_shared__"] || x("__core-js_shared__", {}),
//           D = Function.toString;
//       "function" != typeof B.inspectSource &&
//           (B.inspectSource = function (t) {
//               return D.call(t);
//           });
//       var M,
//           O,
//           P,
//           I,
//           $ = B.inspectSource,
//           R = s.WeakMap,
//           N = "function" == typeof R && /native code/.test($(R)),
//           j = n(function (t) {
//               (t.exports = function (t, e) {
//                   return B[t] || (B[t] = void 0 !== e ? e : {});
//               })("versions", []).push({ version: "3.4.8", mode: "global", copyright: "© 2019 Denis Pushkarev (zloirock.ru)" });
//           }),
//           V = 0,
//           L = Math.random(),
//           H = j("keys"),
//           z = {},
//           U = s.WeakMap;
//       if (N) {
//           var Y = new U(),
//               q = Y.get,
//               G = Y.has,
//               W = Y.set;
//           (M = function (t, e) {
//               return W.call(Y, t, e), e;
//           }),
//               (O = function (t) {
//                   return q.call(Y, t) || {};
//               }),
//               (P = function (t) {
//                   return G.call(Y, t);
//               });
//       } else {
//           var Z =
//               H[(I = "state")] ||
//               (H[I] = (function (t) {
//                   return "Symbol(" + String(void 0 === t ? "" : t) + ")_" + (++V + L).toString(36);
//               })(I));
//           (z[Z] = !0),
//               (M = function (t, e) {
//                   return T(t, Z, e), e;
//               }),
//               (O = function (t) {
//                   return _(t, Z) ? t[Z] : {};
//               }),
//               (P = function (t) {
//                   return _(t, Z);
//               });
//       }
//       var K = {
//               set: M,
//               get: O,
//               has: P,
//               enforce: function (t) {
//                   return P(t) ? O(t) : M(t, {});
//               },
//               getterFor: function (t) {
//                   return function (e) {
//                       var n;
//                       if (!g(e) || (n = O(e)).type !== t) throw TypeError("Incompatible receiver, " + t + " required");
//                       return n;
//                   };
//               },
//           },
//           X = n(function (t) {
//               var e = K.get,
//                   n = K.enforce,
//                   i = String(String).split("String");
//               (t.exports = function (t, e, a, r) {
//                   var o = !!r && !!r.unsafe,
//                       u = !!r && !!r.enumerable,
//                       l = !!r && !!r.noTargetGet;
//                   "function" == typeof a && ("string" != typeof e || _(a, "name") || T(a, "name", e), (n(a).source = i.join("string" == typeof e ? e : ""))),
//                       t !== s ? (o ? !l && t[e] && (u = !0) : delete t[e], u ? (t[e] = a) : T(t, e, a)) : u ? (t[e] = a) : x(e, a);
//               })(Function.prototype, "toString", function () {
//                   return ("function" == typeof this && e(this).source) || $(this);
//               });
//           }),
//           J = s,
//           Q = function (t) {
//               return "function" == typeof t ? t : void 0;
//           },
//           tt = function (t, e) {
//               return arguments.length < 2 ? Q(J[t]) || Q(s[t]) : (J[t] && J[t][e]) || (s[t] && s[t][e]);
//           },
//           et = Math.ceil,
//           nt = Math.floor,
//           it = function (t) {
//               return isNaN((t = +t)) ? 0 : (t > 0 ? nt : et)(t);
//           },
//           st = Math.min,
//           at = function (t) {
//               return t > 0 ? st(it(t), 9007199254740991) : 0;
//           },
//           rt = Math.max,
//           ot = Math.min,
//           ut = function (t) {
//               return function (e, n, i) {
//                   var s,
//                       a = v(e),
//                       r = at(a.length),
//                       o = (function (t, e) {
//                           var n = it(t);
//                           return n < 0 ? rt(n + e, 0) : ot(n, e);
//                       })(i, r);
//                   if (t && n != n) {
//                       for (; r > o; ) if ((s = a[o++]) != s) return !0;
//                   } else for (; r > o; o++) if ((t || o in a) && a[o] === n) return t || o || 0;
//                   return !t && -1;
//               };
//           },
//           lt = { includes: ut(!0), indexOf: ut(!1) }.indexOf,
//           ht = function (t, e) {
//               var n,
//                   i = v(t),
//                   s = 0,
//                   a = [];
//               for (n in i) !_(z, n) && _(i, n) && a.push(n);
//               for (; e.length > s; ) _(i, (n = e[s++])) && (~lt(a, n) || a.push(n));
//               return a;
//           },
//           ct = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"],
//           dt = ct.concat("length", "prototype"),
//           pt = {
//               f:
//                   Object.getOwnPropertyNames ||
//                   function (t) {
//                       return ht(t, dt);
//                   },
//           },
//           ft = { f: Object.getOwnPropertySymbols },
//           vt =
//               tt("Reflect", "ownKeys") ||
//               function (t) {
//                   var e = pt.f(A(t)),
//                       n = ft.f;
//                   return n ? e.concat(n(t)) : e;
//               },
//           gt = function (t, e) {
//               for (var n = vt(e), i = w.f, s = E.f, a = 0; a < n.length; a++) {
//                   var r = n[a];
//                   _(t, r) || i(t, r, s(e, r));
//               }
//           },
//           mt = /#|\.prototype\./,
//           kt = function (t, e) {
//               var n = yt[_t(t)];
//               return n == Ct || (n != bt && ("function" == typeof e ? a(e) : !!e));
//           },
//           _t = (kt.normalize = function (t) {
//               return String(t).replace(mt, ".").toLowerCase();
//           }),
//           yt = (kt.data = {}),
//           bt = (kt.NATIVE = "N"),
//           Ct = (kt.POLYFILL = "P"),
//           St = kt,
//           Et = E.f,
//           At = function (t, e) {
//               var n,
//                   i,
//                   a,
//                   r,
//                   o,
//                   u = t.target,
//                   l = t.global,
//                   h = t.stat;
//               if ((n = l ? s : h ? s[u] || x(u, {}) : (s[u] || {}).prototype))
//                   for (i in e) {
//                       if (((r = e[i]), (a = t.noTargetGet ? (o = Et(n, i)) && o.value : n[i]), !St(l ? i : u + (h ? "." : "#") + i, t.forced) && void 0 !== a)) {
//                           if (typeof r == typeof a) continue;
//                           gt(r, a);
//                       }
//                       (t.sham || (a && a.sham)) && T(r, "sham", !0), X(n, i, r, t);
//                   }
//           },
//           Ft =
//               Object.keys ||
//               function (t) {
//                   return ht(t, ct);
//               },
//           wt = Object.assign,
//           Tt = Object.defineProperty,
//           xt =
//               !wt ||
//               a(function () {
//                   if (
//                       r &&
//                       1 !==
//                           wt(
//                               { b: 1 },
//                               wt(
//                                   Tt({}, "a", {
//                                       enumerable: !0,
//                                       get: function () {
//                                           Tt(this, "b", { value: 3, enumerable: !1 });
//                                       },
//                                   }),
//                                   { b: 2 }
//                               )
//                           ).b
//                   )
//                       return !0;
//                   var t = {},
//                       e = {},
//                       n = Symbol();
//                   return (
//                       (t[n] = 7),
//                       "abcdefghijklmnopqrst".split("").forEach(function (t) {
//                           e[t] = t;
//                       }),
//                       7 != wt({}, t)[n] || "abcdefghijklmnopqrst" != Ft(wt({}, e)).join("")
//                   );
//               })
//                   ? function (t, e) {
//                         for (var n = Object(f(t)), i = arguments.length, s = 1, a = ft.f, o = l.f; i > s; )
//                             for (var u, h = p(arguments[s++]), c = a ? Ft(h).concat(a(h)) : Ft(h), d = c.length, v = 0; d > v; ) (u = c[v++]), (r && !o.call(h, u)) || (n[u] = h[u]);
//                         return n;
//                     }
//                   : wt;
//       At({ target: "Object", stat: !0, forced: Object.assign !== xt }, { assign: xt });
//       var Bt =
//               "".repeat ||
//               function (t) {
//                   var e = String(f(this)),
//                       n = "",
//                       i = it(t);
//                   if (i < 0 || i == 1 / 0) throw RangeError("Wrong number of repetitions");
//                   for (; i > 0; (i >>>= 1) && (e += e)) 1 & i && (n += e);
//                   return n;
//               },
//           Dt = Math.ceil,
//           Mt = function (t) {
//               return function (e, n, i) {
//                   var s,
//                       a,
//                       r = String(f(e)),
//                       o = r.length,
//                       u = void 0 === i ? " " : String(i),
//                       l = at(n);
//                   return l <= o || "" == u ? r : ((s = l - o), (a = Bt.call(u, Dt(s / u.length))).length > s && (a = a.slice(0, s)), t ? r + a : a + r);
//               };
//           },
//           Ot = { start: Mt(!1), end: Mt(!0) },
//           Pt = tt("navigator", "userAgent") || "",
//           It = /Version\/10\.\d+(\.\d+)?( Mobile\/\w+)? Safari\//.test(Pt),
//           $t = Ot.end;
//       At(
//           { target: "String", proto: !0, forced: It },
//           {
//               padEnd: function (t) {
//                   return $t(this, t, arguments.length > 1 ? arguments[1] : void 0);
//               },
//           }
//       );
//       var Rt = Ot.start;
//       function Nt(t) {
//           return (Nt =
//               "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
//                   ? function (t) {
//                         return typeof t;
//                     }
//                   : function (t) {
//                         return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
//                     })(t);
//       }
//       function jt(t, e) {
//           if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
//       }
//       function Vt(t, e) {
//           for (var n = 0; n < e.length; n++) {
//               var i = e[n];
//               (i.enumerable = i.enumerable || !1), (i.configurable = !0), "value" in i && (i.writable = !0), Object.defineProperty(t, i.key, i);
//           }
//       }
//       function Lt(t, e, n) {
//           return e && Vt(t.prototype, e), n && Vt(t, n), t;
//       }
//       function Ht(t, e) {
//           if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
//           (t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } })), e && Ut(t, e);
//       }
//       function zt(t) {
//           return (zt = Object.setPrototypeOf
//               ? Object.getPrototypeOf
//               : function (t) {
//                     return t.__proto__ || Object.getPrototypeOf(t);
//                 })(t);
//       }
//       function Ut(t, e) {
//           return (Ut =
//               Object.setPrototypeOf ||
//               function (t, e) {
//                   return (t.__proto__ = e), t;
//               })(t, e);
//       }
//       function Yt(t, e) {
//           if (null == t) return {};
//           var n,
//               i,
//               s = (function (t, e) {
//                   if (null == t) return {};
//                   var n,
//                       i,
//                       s = {},
//                       a = Object.keys(t);
//                   for (i = 0; i < a.length; i++) (n = a[i]), e.indexOf(n) >= 0 || (s[n] = t[n]);
//                   return s;
//               })(t, e);
//           if (Object.getOwnPropertySymbols) {
//               var a = Object.getOwnPropertySymbols(t);
//               for (i = 0; i < a.length; i++) (n = a[i]), e.indexOf(n) >= 0 || (Object.prototype.propertyIsEnumerable.call(t, n) && (s[n] = t[n]));
//           }
//           return s;
//       }
//       function qt(t, e) {
//           return !e || ("object" != typeof e && "function" != typeof e)
//               ? (function (t) {
//                     if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
//                     return t;
//                 })(t)
//               : e;
//       }
//       function Gt(t, e) {
//           for (; !Object.prototype.hasOwnProperty.call(t, e) && null !== (t = zt(t)); );
//           return t;
//       }
//       function Wt(t, e, n) {
//           return (Wt =
//               "undefined" != typeof Reflect && Reflect.get
//                   ? Reflect.get
//                   : function (t, e, n) {
//                         var i = Gt(t, e);
//                         if (i) {
//                             var s = Object.getOwnPropertyDescriptor(i, e);
//                             return s.get ? s.get.call(n) : s.value;
//                         }
//                     })(t, e, n || t);
//       }
//       function Zt(t, e, n, i) {
//           return (Zt =
//               "undefined" != typeof Reflect && Reflect.set
//                   ? Reflect.set
//                   : function (t, e, n, i) {
//                         var s,
//                             a = Gt(t, e);
//                         if (a) {
//                             if ((s = Object.getOwnPropertyDescriptor(a, e)).set) return s.set.call(i, n), !0;
//                             if (!s.writable) return !1;
//                         }
//                         if ((s = Object.getOwnPropertyDescriptor(i, e))) {
//                             if (!s.writable) return !1;
//                             (s.value = n), Object.defineProperty(i, e, s);
//                         } else
//                             !(function (t, e, n) {
//                                 e in t ? Object.defineProperty(t, e, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : (t[e] = n);
//                             })(i, e, n);
//                         return !0;
//                     })(t, e, n, i);
//       }
//       function Kt(t, e, n, i, s) {
//           if (!Zt(t, e, n, i || t) && s) throw new Error("failed to set property");
//           return n;
//       }
//       function Xt(t, e) {
//           return (
//               (function (t) {
//                   if (Array.isArray(t)) return t;
//               })(t) ||
//               (function (t, e) {
//                   if (!(Symbol.iterator in Object(t) || "[object Arguments]" === Object.prototype.toString.call(t))) return;
//                   var n = [],
//                       i = !0,
//                       s = !1,
//                       a = void 0;
//                   try {
//                       for (var r, o = t[Symbol.iterator](); !(i = (r = o.next()).done) && (n.push(r.value), !e || n.length !== e); i = !0);
//                   } catch (t) {
//                       (s = !0), (a = t);
//                   } finally {
//                       try {
//                           i || null == o.return || o.return();
//                       } finally {
//                           if (s) throw a;
//                       }
//                   }
//                   return n;
//               })(t, e) ||
//               (function () {
//                   throw new TypeError("Invalid attempt to destructure non-iterable instance");
//               })()
//           );
//       }
//       function Jt(t) {
//           return "string" == typeof t || t instanceof String;
//       }
//       At(
//           { target: "String", proto: !0, forced: It },
//           {
//               padStart: function (t) {
//                   return Rt(this, t, arguments.length > 1 ? arguments[1] : void 0);
//               },
//           }
//       ),
//           At({ target: "String", proto: !0 }, { repeat: Bt }),
//           (function (t) {
//               function e() {
//                   (this.globalThis = this), delete t.prototype._T_;
//               }
//               "object" != typeof globalThis && (this ? e() : (t.defineProperty(t.prototype, "_T_", { configurable: !0, get: e }), _T_));
//           })(Object);
//       var Qt = { NONE: "NONE", LEFT: "LEFT", FORCE_LEFT: "FORCE_LEFT", RIGHT: "RIGHT", FORCE_RIGHT: "FORCE_RIGHT" };
//       function te(t) {
//           return t.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
//       }
//       var ee = (function () {
//               function t(e, n, i, s) {
//                   for (jt(this, t), this.value = e, this.cursorPos = n, this.oldValue = i, this.oldSelection = s; this.value.slice(0, this.startChangePos) !== this.oldValue.slice(0, this.startChangePos); ) --this.oldSelection.start;
//               }
//               return (
//                   Lt(t, [
//                       {
//                           key: "startChangePos",
//                           get: function () {
//                               return Math.min(this.cursorPos, this.oldSelection.start);
//                           },
//                       },
//                       {
//                           key: "insertedCount",
//                           get: function () {
//                               return this.cursorPos - this.startChangePos;
//                           },
//                       },
//                       {
//                           key: "inserted",
//                           get: function () {
//                               return this.value.substr(this.startChangePos, this.insertedCount);
//                           },
//                       },
//                       {
//                           key: "removedCount",
//                           get: function () {
//                               return Math.max(this.oldSelection.end - this.startChangePos || this.oldValue.length - this.value.length, 0);
//                           },
//                       },
//                       {
//                           key: "removed",
//                           get: function () {
//                               return this.oldValue.substr(this.startChangePos, this.removedCount);
//                           },
//                       },
//                       {
//                           key: "head",
//                           get: function () {
//                               return this.value.substring(0, this.startChangePos);
//                           },
//                       },
//                       {
//                           key: "tail",
//                           get: function () {
//                               return this.value.substring(this.startChangePos + this.insertedCount);
//                           },
//                       },
//                       {
//                           key: "removeDirection",
//                           get: function () {
//                               return !this.removedCount || this.insertedCount ? Qt.NONE : this.oldSelection.end === this.cursorPos || this.oldSelection.start === this.cursorPos ? Qt.RIGHT : Qt.LEFT;
//                           },
//                       },
//                   ]),
//                   t
//               );
//           })(),
//           ne = (function () {
//               function t(e) {
//                   jt(this, t), Object.assign(this, { inserted: "", rawInserted: "", skip: !1, tailShift: 0 }, e);
//               }
//               return (
//                   Lt(t, [
//                       {
//                           key: "aggregate",
//                           value: function (t) {
//                               return (this.rawInserted += t.rawInserted), (this.skip = this.skip || t.skip), (this.inserted += t.inserted), (this.tailShift += t.tailShift), this;
//                           },
//                       },
//                       {
//                           key: "offset",
//                           get: function () {
//                               return this.tailShift + this.inserted.length;
//                           },
//                       },
//                   ]),
//                   t
//               );
//           })(),
//           ie = (function () {
//               function t() {
//                   var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "",
//                       n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0,
//                       i = arguments.length > 2 ? arguments[2] : void 0;
//                   jt(this, t), (this.value = e), (this.from = n), (this.stop = i);
//               }
//               return (
//                   Lt(t, [
//                       {
//                           key: "toString",
//                           value: function () {
//                               return this.value;
//                           },
//                       },
//                       {
//                           key: "extend",
//                           value: function (t) {
//                               this.value += String(t);
//                           },
//                       },
//                       {
//                           key: "appendTo",
//                           value: function (t) {
//                               return t.append(this.toString(), { tail: !0 }).aggregate(t._appendPlaceholder());
//                           },
//                       },
//                       {
//                           key: "shiftBefore",
//                           value: function (t) {
//                               if (this.from >= t || !this.value.length) return "";
//                               var e = this.value[0];
//                               return (this.value = this.value.slice(1)), e;
//                           },
//                       },
//                       {
//                           key: "state",
//                           get: function () {
//                               return { value: this.value, from: this.from, stop: this.stop };
//                           },
//                           set: function (t) {
//                               Object.assign(this, t);
//                           },
//                       },
//                   ]),
//                   t
//               );
//           })();
//       function se(t) {
//           var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
//           return new se.InputMask(t, e);
//       }
//       var ae = (function () {
//           function t(e) {
//               jt(this, t), (this._value = ""), this._update(Object.assign({}, t.DEFAULTS, {}, e)), (this.isInitialized = !0);
//           }
//           return (
//               Lt(t, [
//                   {
//                       key: "updateOptions",
//                       value: function (t) {
//                           Object.keys(t).length && this.withValueRefresh(this._update.bind(this, t));
//                       },
//                   },
//                   {
//                       key: "_update",
//                       value: function (t) {
//                           Object.assign(this, t);
//                       },
//                   },
//                   {
//                       key: "reset",
//                       value: function () {
//                           this._value = "";
//                       },
//                   },
//                   {
//                       key: "resolve",
//                       value: function (t) {
//                           return this.reset(), this.append(t, { input: !0 }, ""), this.doCommit(), this.value;
//                       },
//                   },
//                   {
//                       key: "nearestInputPos",
//                       value: function (t, e) {
//                           return t;
//                       },
//                   },
//                   {
//                       key: "extractInput",
//                       value: function () {
//                           var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                               e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
//                           return this.value.slice(t, e);
//                       },
//                   },
//                   {
//                       key: "extractTail",
//                       value: function () {
//                           var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                               e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
//                           return new ie(this.extractInput(t, e), t);
//                       },
//                   },
//                   {
//                       key: "appendTail",
//                       value: function (t) {
//                           return Jt(t) && (t = new ie(String(t))), t.appendTo(this);
//                       },
//                   },
//                   {
//                       key: "_appendCharRaw",
//                       value: function (t) {
//                           var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
//                           return (t = this.doPrepare(t, e)) ? ((this._value += t), new ne({ inserted: t, rawInserted: t })) : new ne();
//                       },
//                   },
//                   {
//                       key: "_appendChar",
//                       value: function (t) {
//                           var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
//                               n = arguments.length > 2 ? arguments[2] : void 0,
//                               i = this.state,
//                               s = this._appendCharRaw(t, e);
//                           if (s.inserted) {
//                               var a,
//                                   r = !1 !== this.doValidate(e);
//                               if (r && null != n) {
//                                   var o = this.state;
//                                   this.overwrite && ((a = n.state), n.shiftBefore(this.value.length));
//                                   var u = this.appendTail(n);
//                                   (r = u.rawInserted === n.toString()) && u.inserted && (this.state = o);
//                               }
//                               r || ((s = new ne()), (this.state = i), n && a && (n.state = a));
//                           }
//                           return s;
//                       },
//                   },
//                   {
//                       key: "_appendPlaceholder",
//                       value: function () {
//                           return new ne();
//                       },
//                   },
//                   {
//                       key: "append",
//                       value: function (t, e, n) {
//                           if (!Jt(t)) throw new Error("value should be string");
//                           var i = new ne(),
//                               s = Jt(n) ? new ie(String(n)) : n;
//                           e.tail && (e._beforeTailState = this.state);
//                           for (var a = 0; a < t.length; ++a) i.aggregate(this._appendChar(t[a], e, s));
//                           return null != s && (i.tailShift += this.appendTail(s).tailShift), i;
//                       },
//                   },
//                   {
//                       key: "remove",
//                       value: function () {
//                           var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                               e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
//                           return (this._value = this.value.slice(0, t) + this.value.slice(e)), new ne();
//                       },
//                   },
//                   {
//                       key: "withValueRefresh",
//                       value: function (t) {
//                           if (this._refreshing || !this.isInitialized) return t();
//                           this._refreshing = !0;
//                           var e = this.rawInputValue,
//                               n = this.value,
//                               i = t();
//                           return (this.rawInputValue = e), this.value !== n && 0 === n.indexOf(this._value) && this.append(n.slice(this._value.length), {}, ""), delete this._refreshing, i;
//                       },
//                   },
//                   {
//                       key: "runIsolated",
//                       value: function (t) {
//                           if (this._isolated || !this.isInitialized) return t(this);
//                           this._isolated = !0;
//                           var e = this.state,
//                               n = t(this);
//                           return (this.state = e), delete this._isolated, n;
//                       },
//                   },
//                   {
//                       key: "doPrepare",
//                       value: function (t) {
//                           var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
//                           return this.prepare ? this.prepare(t, this, e) : t;
//                       },
//                   },
//                   {
//                       key: "doValidate",
//                       value: function (t) {
//                           return (!this.validate || this.validate(this.value, this, t)) && (!this.parent || this.parent.doValidate(t));
//                       },
//                   },
//                   {
//                       key: "doCommit",
//                       value: function () {
//                           this.commit && this.commit(this.value, this);
//                       },
//                   },
//                   {
//                       key: "doFormat",
//                       value: function (t) {
//                           return this.format ? this.format(t, this) : t;
//                       },
//                   },
//                   {
//                       key: "doParse",
//                       value: function (t) {
//                           return this.parse ? this.parse(t, this) : t;
//                       },
//                   },
//                   {
//                       key: "splice",
//                       value: function (t, e, n, i) {
//                           var s = t + e,
//                               a = this.extractTail(s),
//                               r = this.nearestInputPos(t, i);
//                           return new ne({ tailShift: r - t }).aggregate(this.remove(r)).aggregate(this.append(n, { input: !0 }, a));
//                       },
//                   },
//                   {
//                       key: "state",
//                       get: function () {
//                           return { _value: this.value };
//                       },
//                       set: function (t) {
//                           this._value = t._value;
//                       },
//                   },
//                   {
//                       key: "value",
//                       get: function () {
//                           return this._value;
//                       },
//                       set: function (t) {
//                           this.resolve(t);
//                       },
//                   },
//                   {
//                       key: "unmaskedValue",
//                       get: function () {
//                           return this.value;
//                       },
//                       set: function (t) {
//                           this.reset(), this.append(t, {}, ""), this.doCommit();
//                       },
//                   },
//                   {
//                       key: "typedValue",
//                       get: function () {
//                           return this.doParse(this.value);
//                       },
//                       set: function (t) {
//                           this.value = this.doFormat(t);
//                       },
//                   },
//                   {
//                       key: "rawInputValue",
//                       get: function () {
//                           return this.extractInput(0, this.value.length, { raw: !0 });
//                       },
//                       set: function (t) {
//                           this.reset(), this.append(t, { raw: !0 }, ""), this.doCommit();
//                       },
//                   },
//                   {
//                       key: "isComplete",
//                       get: function () {
//                           return !0;
//                       },
//                   },
//               ]),
//               t
//           );
//       })();
//       function re(t) {
//           if (null == t) throw new Error("mask property should be defined");
//           return t instanceof RegExp
//               ? se.MaskedRegExp
//               : Jt(t)
//               ? se.MaskedPattern
//               : t instanceof Date || t === Date
//               ? se.MaskedDate
//               : t instanceof Number || "number" == typeof t || t === Number
//               ? se.MaskedNumber
//               : Array.isArray(t) || t === Array
//               ? se.MaskedDynamic
//               : se.Masked && t.prototype instanceof se.Masked
//               ? t
//               : t instanceof Function
//               ? se.MaskedFunction
//               : (console.warn("Mask not found for mask", t), se.Masked);
//       }
//       function oe(t) {
//           if (se.Masked && t instanceof se.Masked) return t;
//           var e = (t = Object.assign({}, t)).mask;
//           if (se.Masked && e instanceof se.Masked) return e;
//           var n = re(e);
//           if (!n) throw new Error("Masked class is not found for provided mask, appropriate module needs to be import manually before creating mask.");
//           return new n(t);
//       }
//       (ae.DEFAULTS = {
//           format: function (t) {
//               return t;
//           },
//           parse: function (t) {
//               return t;
//           },
//       }),
//           (se.Masked = ae),
//           (se.createMask = oe);
//       var ue = {
//               0: /\d/,
//               a: /[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
//               "*": /./,
//           },
//           le = (function () {
//               function t(e) {
//                   jt(this, t);
//                   var n = e.mask,
//                       i = Yt(e, ["mask"]);
//                   (this.masked = oe({ mask: n })), Object.assign(this, i);
//               }
//               return (
//                   Lt(t, [
//                       {
//                           key: "reset",
//                           value: function () {
//                               (this._isFilled = !1), this.masked.reset();
//                           },
//                       },
//                       {
//                           key: "remove",
//                           value: function () {
//                               var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                                   e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
//                               return 0 === t && e >= 1 ? ((this._isFilled = !1), this.masked.remove(t, e)) : new ne();
//                           },
//                       },
//                       {
//                           key: "_appendChar",
//                           value: function (t) {
//                               var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
//                               if (this._isFilled) return new ne();
//                               var n = this.masked.state,
//                                   i = this.masked._appendChar(t, e);
//                               return (
//                                   i.inserted && !1 === this.doValidate(e) && ((i.inserted = i.rawInserted = ""), (this.masked.state = n)),
//                                   i.inserted || this.isOptional || this.lazy || e.input || (i.inserted = this.placeholderChar),
//                                   (i.skip = !i.inserted && !this.isOptional),
//                                   (this._isFilled = Boolean(i.inserted)),
//                                   i
//                               );
//                           },
//                       },
//                       {
//                           key: "append",
//                           value: function () {
//                               var t;
//                               return (t = this.masked).append.apply(t, arguments);
//                           },
//                       },
//                       {
//                           key: "_appendPlaceholder",
//                           value: function () {
//                               var t = new ne();
//                               return this._isFilled || this.isOptional ? t : ((this._isFilled = !0), (t.inserted = this.placeholderChar), t);
//                           },
//                       },
//                       {
//                           key: "extractTail",
//                           value: function () {
//                               var t;
//                               return (t = this.masked).extractTail.apply(t, arguments);
//                           },
//                       },
//                       {
//                           key: "appendTail",
//                           value: function () {
//                               var t;
//                               return (t = this.masked).appendTail.apply(t, arguments);
//                           },
//                       },
//                       {
//                           key: "extractInput",
//                           value: function () {
//                               var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                                   e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
//                                   n = arguments.length > 2 ? arguments[2] : void 0;
//                               return this.masked.extractInput(t, e, n);
//                           },
//                       },
//                       {
//                           key: "nearestInputPos",
//                           value: function (t) {
//                               var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Qt.NONE,
//                                   n = this.value.length,
//                                   i = Math.min(Math.max(t, 0), n);
//                               switch (e) {
//                                   case Qt.LEFT:
//                                   case Qt.FORCE_LEFT:
//                                       return this.isComplete ? i : 0;
//                                   case Qt.RIGHT:
//                                   case Qt.FORCE_RIGHT:
//                                       return this.isComplete ? i : n;
//                                   case Qt.NONE:
//                                   default:
//                                       return i;
//                               }
//                           },
//                       },
//                       {
//                           key: "doValidate",
//                           value: function () {
//                               var t, e;
//                               return (t = this.masked).doValidate.apply(t, arguments) && (!this.parent || (e = this.parent).doValidate.apply(e, arguments));
//                           },
//                       },
//                       {
//                           key: "doCommit",
//                           value: function () {
//                               this.masked.doCommit();
//                           },
//                       },
//                       {
//                           key: "value",
//                           get: function () {
//                               return this.masked.value || (this._isFilled && !this.isOptional ? this.placeholderChar : "");
//                           },
//                       },
//                       {
//                           key: "unmaskedValue",
//                           get: function () {
//                               return this.masked.unmaskedValue;
//                           },
//                       },
//                       {
//                           key: "isComplete",
//                           get: function () {
//                               return Boolean(this.masked.value) || this.isOptional;
//                           },
//                       },
//                       {
//                           key: "state",
//                           get: function () {
//                               return { masked: this.masked.state, _isFilled: this._isFilled };
//                           },
//                           set: function (t) {
//                               (this.masked.state = t.masked), (this._isFilled = t._isFilled);
//                           },
//                       },
//                   ]),
//                   t
//               );
//           })(),
//           he = (function () {
//               function t(e) {
//                   jt(this, t), Object.assign(this, e), (this._value = "");
//               }
//               return (
//                   Lt(t, [
//                       {
//                           key: "reset",
//                           value: function () {
//                               (this._isRawInput = !1), (this._value = "");
//                           },
//                       },
//                       {
//                           key: "remove",
//                           value: function () {
//                               var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                                   e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this._value.length;
//                               return (this._value = this._value.slice(0, t) + this._value.slice(e)), this._value || (this._isRawInput = !1), new ne();
//                           },
//                       },
//                       {
//                           key: "nearestInputPos",
//                           value: function (t) {
//                               var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Qt.NONE,
//                                   n = this._value.length;
//                               switch (e) {
//                                   case Qt.LEFT:
//                                   case Qt.FORCE_LEFT:
//                                       return 0;
//                                   case Qt.NONE:
//                                   case Qt.RIGHT:
//                                   case Qt.FORCE_RIGHT:
//                                   default:
//                                       return n;
//                               }
//                           },
//                       },
//                       {
//                           key: "extractInput",
//                           value: function () {
//                               var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                                   e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this._value.length;
//                               return ((arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {}).raw && this._isRawInput && this._value.slice(t, e)) || "";
//                           },
//                       },
//                       {
//                           key: "_appendChar",
//                           value: function (t) {
//                               var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
//                                   n = new ne();
//                               if (this._value) return n;
//                               var i = this.char === t[0] && (this.isUnmasking || e.input || e.raw) && !e.tail;
//                               return i && (n.rawInserted = this.char), (this._value = n.inserted = this.char), (this._isRawInput = i && (e.raw || e.input)), n;
//                           },
//                       },
//                       {
//                           key: "_appendPlaceholder",
//                           value: function () {
//                               var t = new ne();
//                               return this._value ? t : ((this._value = t.inserted = this.char), t);
//                           },
//                       },
//                       {
//                           key: "extractTail",
//                           value: function () {
//                               arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length;
//                               return new ie("");
//                           },
//                       },
//                       {
//                           key: "appendTail",
//                           value: function (t) {
//                               return Jt(t) && (t = new ie(String(t))), t.appendTo(this);
//                           },
//                       },
//                       {
//                           key: "append",
//                           value: function (t, e, n) {
//                               var i = this._appendChar(t, e);
//                               return null != n && (i.tailShift += this.appendTail(n).tailShift), i;
//                           },
//                       },
//                       { key: "doCommit", value: function () {} },
//                       {
//                           key: "value",
//                           get: function () {
//                               return this._value;
//                           },
//                       },
//                       {
//                           key: "unmaskedValue",
//                           get: function () {
//                               return this.isUnmasking ? this.value : "";
//                           },
//                       },
//                       {
//                           key: "isComplete",
//                           get: function () {
//                               return !0;
//                           },
//                       },
//                       {
//                           key: "state",
//                           get: function () {
//                               return { _value: this._value, _isRawInput: this._isRawInput };
//                           },
//                           set: function (t) {
//                               Object.assign(this, t);
//                           },
//                       },
//                   ]),
//                   t
//               );
//           })(),
//           ce = (function () {
//               function t() {
//                   var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [],
//                       n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : 0;
//                   jt(this, t), (this.chunks = e), (this.from = n);
//               }
//               return (
//                   Lt(t, [
//                       {
//                           key: "toString",
//                           value: function () {
//                               return this.chunks.map(String).join("");
//                           },
//                       },
//                       {
//                           key: "extend",
//                           value: function (e) {
//                               if (String(e)) {
//                                   Jt(e) && (e = new ie(String(e)));
//                                   var n = this.chunks[this.chunks.length - 1],
//                                       i = n && (n.stop === e.stop || null == e.stop) && e.from === n.from + n.toString().length;
//                                   if (e instanceof ie) i ? n.extend(e.toString()) : this.chunks.push(e);
//                                   else if (e instanceof t) {
//                                       if (null == e.stop) for (var s; e.chunks.length && null == e.chunks[0].stop; ) ((s = e.chunks.shift()).from += e.from), this.extend(s);
//                                       e.toString() && ((e.stop = e.blockIndex), this.chunks.push(e));
//                                   }
//                               }
//                           },
//                       },
//                       {
//                           key: "appendTo",
//                           value: function (e) {
//                               if (!(e instanceof se.MaskedPattern)) return new ie(this.toString()).appendTo(e);
//                               for (var n = new ne(), i = 0; i < this.chunks.length && !n.skip; ++i) {
//                                   var s = this.chunks[i],
//                                       a = e._mapPosToBlock(e.value.length),
//                                       r = s.stop,
//                                       o = void 0;
//                                   if ((r && (!a || a.index <= r) && ((s instanceof t || e._stops.indexOf(r) >= 0) && n.aggregate(e._appendPlaceholder(r)), (o = s instanceof t && e._blocks[r])), o)) {
//                                       var u = o.appendTail(s);
//                                       (u.skip = !1), n.aggregate(u), (e._value += u.inserted);
//                                       var l = s.toString().slice(u.rawInserted.length);
//                                       l && n.aggregate(e.append(l, { tail: !0 }));
//                                   } else n.aggregate(e.append(s.toString(), { tail: !0 }));
//                               }
//                               return n;
//                           },
//                       },
//                       {
//                           key: "shiftBefore",
//                           value: function (t) {
//                               if (this.from >= t || !this.chunks.length) return "";
//                               for (var e = t - this.from, n = 0; n < this.chunks.length; ) {
//                                   var i = this.chunks[n],
//                                       s = i.shiftBefore(e);
//                                   if (i.toString()) {
//                                       if (!s) break;
//                                       ++n;
//                                   } else this.chunks.splice(n, 1);
//                                   if (s) return s;
//                               }
//                               return "";
//                           },
//                       },
//                       {
//                           key: "state",
//                           get: function () {
//                               return {
//                                   chunks: this.chunks.map(function (t) {
//                                       return t.state;
//                                   }),
//                                   from: this.from,
//                                   stop: this.stop,
//                                   blockIndex: this.blockIndex,
//                               };
//                           },
//                           set: function (e) {
//                               var n = e.chunks,
//                                   i = Yt(e, ["chunks"]);
//                               Object.assign(this, i),
//                                   (this.chunks = n.map(function (e) {
//                                       var n = "chunks" in e ? new t() : new ie();
//                                       return (n.state = e), n;
//                                   }));
//                           },
//                       },
//                   ]),
//                   t
//               );
//           })(),
//           de = (function (t) {
//               function e() {
//                   var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
//                   return jt(this, e), (t.definitions = Object.assign({}, ue, t.definitions)), qt(this, zt(e).call(this, Object.assign({}, e.DEFAULTS, {}, t)));
//               }
//               return (
//                   Ht(e, ae),
//                   Lt(e, [
//                       {
//                           key: "_update",
//                           value: function () {
//                               var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {};
//                               (t.definitions = Object.assign({}, this.definitions, t.definitions)), Wt(zt(e.prototype), "_update", this).call(this, t), this._rebuildMask();
//                           },
//                       },
//                       {
//                           key: "_rebuildMask",
//                           value: function () {
//                               var t = this,
//                                   n = this.definitions;
//                               (this._blocks = []), (this._stops = []), (this._maskedBlocks = {});
//                               var i = this.mask;
//                               if (i && n)
//                                   for (var s = !1, a = !1, r = 0; r < i.length; ++r) {
//                                       if (this.blocks)
//                                           if (
//                                               "continue" ===
//                                               (function () {
//                                                   var e = i.slice(r),
//                                                       n = Object.keys(t.blocks).filter(function (t) {
//                                                           return 0 === e.indexOf(t);
//                                                       });
//                                                   n.sort(function (t, e) {
//                                                       return e.length - t.length;
//                                                   });
//                                                   var s = n[0];
//                                                   if (s) {
//                                                       var a = oe(Object.assign({ parent: t, lazy: t.lazy, placeholderChar: t.placeholderChar, overwrite: t.overwrite }, t.blocks[s]));
//                                                       return a && (t._blocks.push(a), t._maskedBlocks[s] || (t._maskedBlocks[s] = []), t._maskedBlocks[s].push(t._blocks.length - 1)), (r += s.length - 1), "continue";
//                                                   }
//                                               })()
//                                           )
//                                               continue;
//                                       var o = i[r],
//                                           u = o in n;
//                                       if (o !== e.STOP_CHAR)
//                                           if ("{" !== o && "}" !== o)
//                                               if ("[" !== o && "]" !== o) {
//                                                   if (o === e.ESCAPE_CHAR) {
//                                                       if (!(o = i[++r])) break;
//                                                       u = !1;
//                                                   }
//                                                   var l = u ? new le({ parent: this, lazy: this.lazy, placeholderChar: this.placeholderChar, mask: n[o], isOptional: a }) : new he({ char: o, isUnmasking: s });
//                                                   this._blocks.push(l);
//                                               } else a = !a;
//                                           else s = !s;
//                                       else this._stops.push(this._blocks.length);
//                                   }
//                           },
//                       },
//                       {
//                           key: "reset",
//                           value: function () {
//                               Wt(zt(e.prototype), "reset", this).call(this),
//                                   this._blocks.forEach(function (t) {
//                                       return t.reset();
//                                   });
//                           },
//                       },
//                       {
//                           key: "doCommit",
//                           value: function () {
//                               this._blocks.forEach(function (t) {
//                                   return t.doCommit();
//                               }),
//                                   Wt(zt(e.prototype), "doCommit", this).call(this);
//                           },
//                       },
//                       {
//                           key: "appendTail",
//                           value: function (t) {
//                               return Wt(zt(e.prototype), "appendTail", this).call(this, t).aggregate(this._appendPlaceholder());
//                           },
//                       },
//                       {
//                           key: "_appendCharRaw",
//                           value: function (t) {
//                               var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
//                               t = this.doPrepare(t, e);
//                               var n = this._mapPosToBlock(this.value.length),
//                                   i = new ne();
//                               if (!n) return i;
//                               for (var s = n.index; ; ++s) {
//                                   var a = this._blocks[s];
//                                   if (!a) break;
//                                   var r = a._appendChar(t, e),
//                                       o = r.skip;
//                                   if ((i.aggregate(r), o || r.rawInserted)) break;
//                               }
//                               return i;
//                           },
//                       },
//                       {
//                           key: "extractTail",
//                           value: function () {
//                               var t = this,
//                                   e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                                   n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
//                                   i = new ce();
//                               return e === n
//                                   ? i
//                                   : (this._forEachBlocksInRange(e, n, function (e, n, s, a) {
//                                         var r = e.extractTail(s, a);
//                                         (r.stop = t._findStopBefore(n)), (r.from = t._blockStartPos(n)), r instanceof ce && (r.blockIndex = n), i.extend(r);
//                                     }),
//                                     i);
//                           },
//                       },
//                       {
//                           key: "extractInput",
//                           value: function () {
//                               var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                                   e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
//                                   n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
//                               if (t === e) return "";
//                               var i = "";
//                               return (
//                                   this._forEachBlocksInRange(t, e, function (t, e, s, a) {
//                                       i += t.extractInput(s, a, n);
//                                   }),
//                                   i
//                               );
//                           },
//                       },
//                       {
//                           key: "_findStopBefore",
//                           value: function (t) {
//                               for (var e, n = 0; n < this._stops.length; ++n) {
//                                   var i = this._stops[n];
//                                   if (!(i <= t)) break;
//                                   e = i;
//                               }
//                               return e;
//                           },
//                       },
//                       {
//                           key: "_appendPlaceholder",
//                           value: function (t) {
//                               var e = this,
//                                   n = new ne();
//                               if (this.lazy && null == t) return n;
//                               var i = this._mapPosToBlock(this.value.length);
//                               if (!i) return n;
//                               var s = i.index,
//                                   a = null != t ? t : this._blocks.length;
//                               return (
//                                   this._blocks.slice(s, a).forEach(function (i) {
//                                       if (!i.lazy || null != t) {
//                                           var s = null != i._blocks ? [i._blocks.length] : [],
//                                               a = i._appendPlaceholder.apply(i, s);
//                                           (e._value += a.inserted), n.aggregate(a);
//                                       }
//                                   }),
//                                   n
//                               );
//                           },
//                       },
//                       {
//                           key: "_mapPosToBlock",
//                           value: function (t) {
//                               for (var e = "", n = 0; n < this._blocks.length; ++n) {
//                                   var i = this._blocks[n],
//                                       s = e.length;
//                                   if (t <= (e += i.value).length) return { index: n, offset: t - s };
//                               }
//                           },
//                       },
//                       {
//                           key: "_blockStartPos",
//                           value: function (t) {
//                               return this._blocks.slice(0, t).reduce(function (t, e) {
//                                   return t + e.value.length;
//                               }, 0);
//                           },
//                       },
//                       {
//                           key: "_forEachBlocksInRange",
//                           value: function (t) {
//                               var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
//                                   n = arguments.length > 2 ? arguments[2] : void 0,
//                                   i = this._mapPosToBlock(t);
//                               if (i) {
//                                   var s = this._mapPosToBlock(e),
//                                       a = s && i.index === s.index,
//                                       r = i.offset,
//                                       o = s && a ? s.offset : this._blocks[i.index].value.length;
//                                   if ((n(this._blocks[i.index], i.index, r, o), s && !a)) {
//                                       for (var u = i.index + 1; u < s.index; ++u) n(this._blocks[u], u, 0, this._blocks[u].value.length);
//                                       n(this._blocks[s.index], s.index, 0, s.offset);
//                                   }
//                               }
//                           },
//                       },
//                       {
//                           key: "remove",
//                           value: function () {
//                               var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                                   n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
//                                   i = Wt(zt(e.prototype), "remove", this).call(this, t, n);
//                               return (
//                                   this._forEachBlocksInRange(t, n, function (t, e, n, s) {
//                                       i.aggregate(t.remove(n, s));
//                                   }),
//                                   i
//                               );
//                           },
//                       },
//                       {
//                           key: "nearestInputPos",
//                           value: function (t) {
//                               var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Qt.NONE,
//                                   n = this._mapPosToBlock(t) || { index: 0, offset: 0 },
//                                   i = n.offset,
//                                   s = n.index,
//                                   a = this._blocks[s];
//                               if (!a) return t;
//                               var r = i;
//                               0 !== r &&
//                                   r < a.value.length &&
//                                   (r = a.nearestInputPos(
//                                       i,
//                                       (function (t) {
//                                           switch (t) {
//                                               case Qt.LEFT:
//                                                   return Qt.FORCE_LEFT;
//                                               case Qt.RIGHT:
//                                                   return Qt.FORCE_RIGHT;
//                                               default:
//                                                   return t;
//                                           }
//                                       })(e)
//                                   ));
//                               var o = r === a.value.length;
//                               if (!(0 === r) && !o) return this._blockStartPos(s) + r;
//                               var u = o ? s + 1 : s;
//                               if (e === Qt.NONE) {
//                                   if (u > 0) {
//                                       var l = u - 1,
//                                           h = this._blocks[l],
//                                           c = h.nearestInputPos(0, Qt.NONE);
//                                       if (!h.value.length || c !== h.value.length) return this._blockStartPos(u);
//                                   }
//                                   for (var d = u; d < this._blocks.length; ++d) {
//                                       var p = this._blocks[d],
//                                           f = p.nearestInputPos(0, Qt.NONE);
//                                       if (!p.value.length || f !== p.value.length) return this._blockStartPos(d) + f;
//                                   }
//                                   for (var v = u - 1; v >= 0; --v) {
//                                       var g = this._blocks[v],
//                                           m = g.nearestInputPos(0, Qt.NONE);
//                                       if (!g.value.length || m !== g.value.length) return this._blockStartPos(v) + g.value.length;
//                                   }
//                                   return t;
//                               }
//                               if (e === Qt.LEFT || e === Qt.FORCE_LEFT) {
//                                   for (var k, _ = u; _ < this._blocks.length; ++_)
//                                       if (this._blocks[_].value) {
//                                           k = _;
//                                           break;
//                                       }
//                                   if (null != k) {
//                                       var y = this._blocks[k],
//                                           b = y.nearestInputPos(0, Qt.RIGHT);
//                                       if (0 === b && y.unmaskedValue.length) return this._blockStartPos(k) + b;
//                                   }
//                                   for (var C, S = -1, E = u - 1; E >= 0; --E) {
//                                       var A = this._blocks[E],
//                                           F = A.nearestInputPos(A.value.length, Qt.FORCE_LEFT);
//                                       if (((A.value && 0 === F) || (C = E), 0 !== F)) {
//                                           if (F !== A.value.length) return this._blockStartPos(E) + F;
//                                           S = E;
//                                           break;
//                                       }
//                                   }
//                                   if (e === Qt.LEFT)
//                                       for (var w = S + 1; w <= Math.min(u, this._blocks.length - 1); ++w) {
//                                           var T = this._blocks[w],
//                                               x = T.nearestInputPos(0, Qt.NONE),
//                                               B = this._blockStartPos(w) + x;
//                                           if (B > t) break;
//                                           if (x !== T.value.length) return B;
//                                       }
//                                   if (S >= 0) return this._blockStartPos(S) + this._blocks[S].value.length;
//                                   if (
//                                       e === Qt.FORCE_LEFT ||
//                                       (this.lazy &&
//                                           !this.extractInput() &&
//                                           !(function (t) {
//                                               if (!t) return !1;
//                                               var e = t.value;
//                                               return !e || t.nearestInputPos(0, Qt.NONE) !== e.length;
//                                           })(this._blocks[u]))
//                                   )
//                                       return 0;
//                                   if (null != C) return this._blockStartPos(C);
//                                   for (var D = u; D < this._blocks.length; ++D) {
//                                       var M = this._blocks[D],
//                                           O = M.nearestInputPos(0, Qt.NONE);
//                                       if (!M.value.length || O !== M.value.length) return this._blockStartPos(D) + O;
//                                   }
//                                   return 0;
//                               }
//                               if (e === Qt.RIGHT || e === Qt.FORCE_RIGHT) {
//                                   for (var P, I, $ = u; $ < this._blocks.length; ++$) {
//                                       var R = this._blocks[$],
//                                           N = R.nearestInputPos(0, Qt.NONE);
//                                       if (N !== R.value.length) {
//                                           (I = this._blockStartPos($) + N), (P = $);
//                                           break;
//                                       }
//                                   }
//                                   if (null != P && null != I) {
//                                       for (var j = P; j < this._blocks.length; ++j) {
//                                           var V = this._blocks[j],
//                                               L = V.nearestInputPos(0, Qt.FORCE_RIGHT);
//                                           if (L !== V.value.length) return this._blockStartPos(j) + L;
//                                       }
//                                       return e === Qt.FORCE_RIGHT ? this.value.length : I;
//                                   }
//                                   for (var H = Math.min(u, this._blocks.length - 1); H >= 0; --H) {
//                                       var z = this._blocks[H],
//                                           U = z.nearestInputPos(z.value.length, Qt.LEFT);
//                                       if (0 !== U) {
//                                           var Y = this._blockStartPos(H) + U;
//                                           if (Y >= t) return Y;
//                                           break;
//                                       }
//                                   }
//                               }
//                               return t;
//                           },
//                       },
//                       {
//                           key: "maskedBlock",
//                           value: function (t) {
//                               return this.maskedBlocks(t)[0];
//                           },
//                       },
//                       {
//                           key: "maskedBlocks",
//                           value: function (t) {
//                               var e = this,
//                                   n = this._maskedBlocks[t];
//                               return n
//                                   ? n.map(function (t) {
//                                         return e._blocks[t];
//                                     })
//                                   : [];
//                           },
//                       },
//                       {
//                           key: "state",
//                           get: function () {
//                               return Object.assign({}, Wt(zt(e.prototype), "state", this), {
//                                   _blocks: this._blocks.map(function (t) {
//                                       return t.state;
//                                   }),
//                               });
//                           },
//                           set: function (t) {
//                               var n = t._blocks,
//                                   i = Yt(t, ["_blocks"]);
//                               this._blocks.forEach(function (t, e) {
//                                   return (t.state = n[e]);
//                               }),
//                                   Kt(zt(e.prototype), "state", i, this, !0);
//                           },
//                       },
//                       {
//                           key: "isComplete",
//                           get: function () {
//                               return this._blocks.every(function (t) {
//                                   return t.isComplete;
//                               });
//                           },
//                       },
//                       {
//                           key: "unmaskedValue",
//                           get: function () {
//                               return this._blocks.reduce(function (t, e) {
//                                   return t + e.unmaskedValue;
//                               }, "");
//                           },
//                           set: function (t) {
//                               Kt(zt(e.prototype), "unmaskedValue", t, this, !0);
//                           },
//                       },
//                       {
//                           key: "value",
//                           get: function () {
//                               return this._blocks.reduce(function (t, e) {
//                                   return t + e.value;
//                               }, "");
//                           },
//                           set: function (t) {
//                               Kt(zt(e.prototype), "value", t, this, !0);
//                           },
//                       },
//                   ]),
//                   e
//               );
//           })();
//       (de.DEFAULTS = { lazy: !0, placeholderChar: "_" }), (de.STOP_CHAR = "`"), (de.ESCAPE_CHAR = "\\"), (de.InputDefinition = le), (de.FixedDefinition = he), (se.MaskedPattern = de);
//       var pe = (function (t) {
//           function e() {
//               return jt(this, e), qt(this, zt(e).apply(this, arguments));
//           }
//           return (
//               Ht(e, de),
//               Lt(e, [
//                   {
//                       key: "_update",
//                       value: function (t) {
//                           t = Object.assign({ to: this.to || 0, from: this.from || 0 }, t);
//                           var n = String(t.to).length;
//                           null != t.maxLength && (n = Math.max(n, t.maxLength)), (t.maxLength = n);
//                           for (var i = String(t.from).padStart(n, "0"), s = String(t.to).padStart(n, "0"), a = 0; a < s.length && s[a] === i[a]; ) ++a;
//                           (t.mask = s.slice(0, a).replace(/0/g, "\\0") + "0".repeat(n - a)), Wt(zt(e.prototype), "_update", this).call(this, t);
//                       },
//                   },
//                   {
//                       key: "boundaries",
//                       value: function (t) {
//                           var e = "",
//                               n = "",
//                               i = Xt(t.match(/^(\D*)(\d*)(\D*)/) || [], 3),
//                               s = i[1],
//                               a = i[2];
//                           return a && ((e = "0".repeat(s.length) + a), (n = "9".repeat(s.length) + a)), [(e = e.padEnd(this.maxLength, "0")), (n = n.padEnd(this.maxLength, "9"))];
//                       },
//                   },
//                   {
//                       key: "doPrepare",
//                       value: function (t) {
//                           var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
//                           if (((t = Wt(zt(e.prototype), "doPrepare", this).call(this, t, n).replace(/\D/g, "")), !this.autofix)) return t;
//                           for (var i = String(this.from).padStart(this.maxLength, "0"), s = String(this.to).padStart(this.maxLength, "0"), a = this.value, r = "", o = 0; o < t.length; ++o) {
//                               var u = a + r + t[o],
//                                   l = Xt(this.boundaries(u), 2),
//                                   h = l[0],
//                                   c = l[1];
//                               Number(c) < this.from ? (r += i[u.length - 1]) : Number(h) > this.to ? (r += s[u.length - 1]) : (r += t[o]);
//                           }
//                           return r;
//                       },
//                   },
//                   {
//                       key: "doValidate",
//                       value: function () {
//                           var t,
//                               n = this.value;
//                           if (-1 === n.search(/[^0]/) && n.length <= this._matchFrom) return !0;
//                           for (var i = Xt(this.boundaries(n), 2), s = i[0], a = i[1], r = arguments.length, o = new Array(r), u = 0; u < r; u++) o[u] = arguments[u];
//                           return this.from <= Number(a) && Number(s) <= this.to && (t = Wt(zt(e.prototype), "doValidate", this)).call.apply(t, [this].concat(o));
//                       },
//                   },
//                   {
//                       key: "_matchFrom",
//                       get: function () {
//                           return this.maxLength - String(this.from).length;
//                       },
//                   },
//                   {
//                       key: "isComplete",
//                       get: function () {
//                           return Wt(zt(e.prototype), "isComplete", this) && Boolean(this.value);
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       se.MaskedRange = pe;
//       var fe = (function (t) {
//           function e(t) {
//               return jt(this, e), qt(this, zt(e).call(this, Object.assign({}, e.DEFAULTS, {}, t)));
//           }
//           return (
//               Ht(e, de),
//               Lt(e, [
//                   {
//                       key: "_update",
//                       value: function (t) {
//                           t.mask === Date && delete t.mask, t.pattern && (t.mask = t.pattern);
//                           var n = t.blocks;
//                           (t.blocks = Object.assign({}, e.GET_DEFAULT_BLOCKS())),
//                               t.min && (t.blocks.Y.from = t.min.getFullYear()),
//                               t.max && (t.blocks.Y.to = t.max.getFullYear()),
//                               t.min &&
//                                   t.max &&
//                                   t.blocks.Y.from === t.blocks.Y.to &&
//                                   ((t.blocks.m.from = t.min.getMonth() + 1), (t.blocks.m.to = t.max.getMonth() + 1), t.blocks.m.from === t.blocks.m.to && ((t.blocks.d.from = t.min.getDate()), (t.blocks.d.to = t.max.getDate()))),
//                               Object.assign(t.blocks, n),
//                               Object.keys(t.blocks).forEach(function (e) {
//                                   var n = t.blocks[e];
//                                   "autofix" in n || (n.autofix = t.autofix);
//                               }),
//                               Wt(zt(e.prototype), "_update", this).call(this, t);
//                       },
//                   },
//                   {
//                       key: "doValidate",
//                       value: function () {
//                           for (var t, n = this.date, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
//                           return (
//                               (t = Wt(zt(e.prototype), "doValidate", this)).call.apply(t, [this].concat(s)) &&
//                               (!this.isComplete || (this.isDateExist(this.value) && null != n && (null == this.min || this.min <= n) && (null == this.max || n <= this.max)))
//                           );
//                       },
//                   },
//                   {
//                       key: "isDateExist",
//                       value: function (t) {
//                           return this.format(this.parse(t, this), this) === t;
//                       },
//                   },
//                   {
//                       key: "date",
//                       get: function () {
//                           return this.typedValue;
//                       },
//                       set: function (t) {
//                           this.typedValue = t;
//                       },
//                   },
//                   {
//                       key: "typedValue",
//                       get: function () {
//                           return this.isComplete ? Wt(zt(e.prototype), "typedValue", this) : null;
//                       },
//                       set: function (t) {
//                           Kt(zt(e.prototype), "typedValue", t, this, !0);
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       (fe.DEFAULTS = {
//           pattern: "d{.}`m{.}`Y",
//           format: function (t) {
//               return [String(t.getDate()).padStart(2, "0"), String(t.getMonth() + 1).padStart(2, "0"), t.getFullYear()].join(".");
//           },
//           parse: function (t) {
//               var e = Xt(t.split("."), 3),
//                   n = e[0],
//                   i = e[1],
//                   s = e[2];
//               return new Date(s, i - 1, n);
//           },
//       }),
//           (fe.GET_DEFAULT_BLOCKS = function () {
//               return { d: { mask: pe, from: 1, to: 31, maxLength: 2 }, m: { mask: pe, from: 1, to: 12, maxLength: 2 }, Y: { mask: pe, from: 1900, to: 9999 } };
//           }),
//           (se.MaskedDate = fe);
//       var ve = (function () {
//           function t() {
//               jt(this, t);
//           }
//           return (
//               Lt(t, [
//                   {
//                       key: "select",
//                       value: function (t, e) {
//                           if (null != t && null != e && (t !== this.selectionStart || e !== this.selectionEnd))
//                               try {
//                                   this._unsafeSelect(t, e);
//                               } catch (t) {}
//                       },
//                   },
//                   { key: "_unsafeSelect", value: function (t, e) {} },
//                   { key: "bindEvents", value: function (t) {} },
//                   { key: "unbindEvents", value: function () {} },
//                   {
//                       key: "selectionStart",
//                       get: function () {
//                           var t;
//                           try {
//                               t = this._unsafeSelectionStart;
//                           } catch (t) {}
//                           return null != t ? t : this.value.length;
//                       },
//                   },
//                   {
//                       key: "selectionEnd",
//                       get: function () {
//                           var t;
//                           try {
//                               t = this._unsafeSelectionEnd;
//                           } catch (t) {}
//                           return null != t ? t : this.value.length;
//                       },
//                   },
//                   {
//                       key: "isActive",
//                       get: function () {
//                           return !1;
//                       },
//                   },
//               ]),
//               t
//           );
//       })();
//       se.MaskElement = ve;
//       var ge = (function (t) {
//           function e(t) {
//               var n;
//               return jt(this, e), ((n = qt(this, zt(e).call(this))).input = t), (n._handlers = {}), n;
//           }
//           return (
//               Ht(e, ve),
//               Lt(e, [
//                   {
//                       key: "_unsafeSelect",
//                       value: function (t, e) {
//                           this.input.setSelectionRange(t, e);
//                       },
//                   },
//                   {
//                       key: "bindEvents",
//                       value: function (t) {
//                           var n = this;
//                           Object.keys(t).forEach(function (i) {
//                               return n._toggleEventHandler(e.EVENTS_MAP[i], t[i]);
//                           });
//                       },
//                   },
//                   {
//                       key: "unbindEvents",
//                       value: function () {
//                           var t = this;
//                           Object.keys(this._handlers).forEach(function (e) {
//                               return t._toggleEventHandler(e);
//                           });
//                       },
//                   },
//                   {
//                       key: "_toggleEventHandler",
//                       value: function (t, e) {
//                           this._handlers[t] && (this.input.removeEventListener(t, this._handlers[t]), delete this._handlers[t]), e && (this.input.addEventListener(t, e), (this._handlers[t] = e));
//                       },
//                   },
//                   {
//                       key: "rootElement",
//                       get: function () {
//                           return this.input.getRootNode ? this.input.getRootNode() : document;
//                       },
//                   },
//                   {
//                       key: "isActive",
//                       get: function () {
//                           return this.input === this.rootElement.activeElement;
//                       },
//                   },
//                   {
//                       key: "_unsafeSelectionStart",
//                       get: function () {
//                           return this.input.selectionStart;
//                       },
//                   },
//                   {
//                       key: "_unsafeSelectionEnd",
//                       get: function () {
//                           return this.input.selectionEnd;
//                       },
//                   },
//                   {
//                       key: "value",
//                       get: function () {
//                           return this.input.value;
//                       },
//                       set: function (t) {
//                           this.input.value = t;
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       (ge.EVENTS_MAP = { selectionChange: "keydown", input: "input", drop: "drop", click: "click", focus: "focus", commit: "blur" }), (se.HTMLMaskElement = ge);
//       var me = (function (t) {
//           function e() {
//               return jt(this, e), qt(this, zt(e).apply(this, arguments));
//           }
//           return (
//               Ht(e, ge),
//               Lt(e, [
//                   {
//                       key: "_unsafeSelect",
//                       value: function (t, e) {
//                           if (this.rootElement.createRange) {
//                               var n = this.rootElement.createRange();
//                               n.setStart(this.input.firstChild || this.input, t), n.setEnd(this.input.lastChild || this.input, e);
//                               var i = this.rootElement,
//                                   s = i.getSelection && i.getSelection();
//                               s && (s.removeAllRanges(), s.addRange(n));
//                           }
//                       },
//                   },
//                   {
//                       key: "_unsafeSelectionStart",
//                       get: function () {
//                           var t = this.rootElement,
//                               e = t.getSelection && t.getSelection();
//                           return e && e.anchorOffset;
//                       },
//                   },
//                   {
//                       key: "_unsafeSelectionEnd",
//                       get: function () {
//                           var t = this.rootElement,
//                               e = t.getSelection && t.getSelection();
//                           return e && this._unsafeSelectionStart + String(e).length;
//                       },
//                   },
//                   {
//                       key: "value",
//                       get: function () {
//                           return this.input.textContent;
//                       },
//                       set: function (t) {
//                           this.input.textContent = t;
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       se.HTMLContenteditableMaskElement = me;
//       var ke = (function () {
//           function t(e, n) {
//               jt(this, t),
//                   (this.el = e instanceof ve ? e : e.isContentEditable && "INPUT" !== e.tagName && "TEXTAREA" !== e.tagName ? new me(e) : new ge(e)),
//                   (this.masked = oe(n)),
//                   (this._listeners = {}),
//                   (this._value = ""),
//                   (this._unmaskedValue = ""),
//                   (this._saveSelection = this._saveSelection.bind(this)),
//                   (this._onInput = this._onInput.bind(this)),
//                   (this._onChange = this._onChange.bind(this)),
//                   (this._onDrop = this._onDrop.bind(this)),
//                   (this._onFocus = this._onFocus.bind(this)),
//                   (this._onClick = this._onClick.bind(this)),
//                   (this.alignCursor = this.alignCursor.bind(this)),
//                   (this.alignCursorFriendly = this.alignCursorFriendly.bind(this)),
//                   this._bindEvents(),
//                   this.updateValue(),
//                   this._onChange();
//           }
//           return (
//               Lt(t, [
//                   {
//                       key: "maskEquals",
//                       value: function (t) {
//                           return null == t || t === this.masked.mask || (t === Date && this.masked instanceof fe);
//                       },
//                   },
//                   {
//                       key: "_bindEvents",
//                       value: function () {
//                           this.el.bindEvents({ selectionChange: this._saveSelection, input: this._onInput, drop: this._onDrop, click: this._onClick, focus: this._onFocus, commit: this._onChange });
//                       },
//                   },
//                   {
//                       key: "_unbindEvents",
//                       value: function () {
//                           this.el.unbindEvents();
//                       },
//                   },
//                   {
//                       key: "_fireEvent",
//                       value: function (t) {
//                           var e = this._listeners[t];
//                           e &&
//                               e.forEach(function (t) {
//                                   return t();
//                               });
//                       },
//                   },
//                   {
//                       key: "_saveSelection",
//                       value: function () {
//                           this.value !== this.el.value && console.warn("Element value was changed outside of mask. Syncronize mask using `mask.updateValue()` to work properly."),
//                               (this._selection = { start: this.selectionStart, end: this.cursorPos });
//                       },
//                   },
//                   {
//                       key: "updateValue",
//                       value: function () {
//                           (this.masked.value = this.el.value), (this._value = this.masked.value);
//                       },
//                   },
//                   {
//                       key: "updateControl",
//                       value: function () {
//                           var t = this.masked.unmaskedValue,
//                               e = this.masked.value,
//                               n = this.unmaskedValue !== t || this.value !== e;
//                           (this._unmaskedValue = t), (this._value = e), this.el.value !== e && (this.el.value = e), n && this._fireChangeEvents();
//                       },
//                   },
//                   {
//                       key: "updateOptions",
//                       value: function (t) {
//                           var e = t.mask,
//                               n = Yt(t, ["mask"]),
//                               i = !this.maskEquals(e),
//                               s = !(function t(e, n) {
//                                   if (n === e) return !0;
//                                   var i,
//                                       s = Array.isArray(n),
//                                       a = Array.isArray(e);
//                                   if (s && a) {
//                                       if (n.length != e.length) return !1;
//                                       for (i = 0; i < n.length; i++) if (!t(n[i], e[i])) return !1;
//                                       return !0;
//                                   }
//                                   if (s != a) return !1;
//                                   if (n && e && "object" === Nt(n) && "object" === Nt(e)) {
//                                       var r = n instanceof Date,
//                                           o = e instanceof Date;
//                                       if (r && o) return n.getTime() == e.getTime();
//                                       if (r != o) return !1;
//                                       var u = n instanceof RegExp,
//                                           l = e instanceof RegExp;
//                                       if (u && l) return n.toString() == e.toString();
//                                       if (u != l) return !1;
//                                       var h = Object.keys(n);
//                                       for (i = 0; i < h.length; i++) if (!Object.prototype.hasOwnProperty.call(e, h[i])) return !1;
//                                       for (i = 0; i < h.length; i++) if (!t(e[h[i]], n[h[i]])) return !1;
//                                       return !0;
//                                   }
//                                   return !(!n || !e || "function" != typeof n || "function" != typeof e) && n.toString() === e.toString();
//                               })(this.masked, n);
//                           i && (this.mask = e), s && this.masked.updateOptions(n), (i || s) && this.updateControl();
//                       },
//                   },
//                   {
//                       key: "updateCursor",
//                       value: function (t) {
//                           null != t && ((this.cursorPos = t), this._delayUpdateCursor(t));
//                       },
//                   },
//                   {
//                       key: "_delayUpdateCursor",
//                       value: function (t) {
//                           var e = this;
//                           this._abortUpdateCursor(),
//                               (this._changingCursorPos = t),
//                               (this._cursorChanging = setTimeout(function () {
//                                   e.el && ((e.cursorPos = e._changingCursorPos), e._abortUpdateCursor());
//                               }, 10));
//                       },
//                   },
//                   {
//                       key: "_fireChangeEvents",
//                       value: function () {
//                           this._fireEvent("accept"), this.masked.isComplete && this._fireEvent("complete");
//                       },
//                   },
//                   {
//                       key: "_abortUpdateCursor",
//                       value: function () {
//                           this._cursorChanging && (clearTimeout(this._cursorChanging), delete this._cursorChanging);
//                       },
//                   },
//                   {
//                       key: "alignCursor",
//                       value: function () {
//                           this.cursorPos = this.masked.nearestInputPos(this.cursorPos, Qt.LEFT);
//                       },
//                   },
//                   {
//                       key: "alignCursorFriendly",
//                       value: function () {
//                           this.selectionStart === this.cursorPos && this.alignCursor();
//                       },
//                   },
//                   {
//                       key: "on",
//                       value: function (t, e) {
//                           return this._listeners[t] || (this._listeners[t] = []), this._listeners[t].push(e), this;
//                       },
//                   },
//                   {
//                       key: "off",
//                       value: function (t, e) {
//                           if (!this._listeners[t]) return this;
//                           if (!e) return delete this._listeners[t], this;
//                           var n = this._listeners[t].indexOf(e);
//                           return n >= 0 && this._listeners[t].splice(n, 1), this;
//                       },
//                   },
//                   {
//                       key: "_onInput",
//                       value: function () {
//                           if ((this._abortUpdateCursor(), !this._selection)) return this.updateValue();
//                           var t = new ee(this.el.value, this.cursorPos, this.value, this._selection),
//                               e = this.masked.rawInputValue,
//                               n = this.masked.splice(t.startChangePos, t.removed.length, t.inserted, t.removeDirection).offset,
//                               i = e === this.masked.rawInputValue ? t.removeDirection : Qt.NONE,
//                               s = this.masked.nearestInputPos(t.startChangePos + n, i);
//                           this.updateControl(), this.updateCursor(s);
//                       },
//                   },
//                   {
//                       key: "_onChange",
//                       value: function () {
//                           this.value !== this.el.value && this.updateValue(), this.masked.doCommit(), this.updateControl(), this._saveSelection();
//                       },
//                   },
//                   {
//                       key: "_onDrop",
//                       value: function (t) {
//                           t.preventDefault(), t.stopPropagation();
//                       },
//                   },
//                   {
//                       key: "_onFocus",
//                       value: function (t) {
//                           this.alignCursorFriendly();
//                       },
//                   },
//                   {
//                       key: "_onClick",
//                       value: function (t) {
//                           this.alignCursorFriendly();
//                       },
//                   },
//                   {
//                       key: "destroy",
//                       value: function () {
//                           this._unbindEvents(), (this._listeners.length = 0), delete this.el;
//                       },
//                   },
//                   {
//                       key: "mask",
//                       get: function () {
//                           return this.masked.mask;
//                       },
//                       set: function (t) {
//                           if (!this.maskEquals(t))
//                               if (this.masked.constructor !== re(t)) {
//                                   var e = oe({ mask: t });
//                                   (e.unmaskedValue = this.masked.unmaskedValue), (this.masked = e);
//                               } else this.masked.updateOptions({ mask: t });
//                       },
//                   },
//                   {
//                       key: "value",
//                       get: function () {
//                           return this._value;
//                       },
//                       set: function (t) {
//                           (this.masked.value = t), this.updateControl(), this.alignCursor();
//                       },
//                   },
//                   {
//                       key: "unmaskedValue",
//                       get: function () {
//                           return this._unmaskedValue;
//                       },
//                       set: function (t) {
//                           (this.masked.unmaskedValue = t), this.updateControl(), this.alignCursor();
//                       },
//                   },
//                   {
//                       key: "typedValue",
//                       get: function () {
//                           return this.masked.typedValue;
//                       },
//                       set: function (t) {
//                           (this.masked.typedValue = t), this.updateControl(), this.alignCursor();
//                       },
//                   },
//                   {
//                       key: "selectionStart",
//                       get: function () {
//                           return this._cursorChanging ? this._changingCursorPos : this.el.selectionStart;
//                       },
//                   },
//                   {
//                       key: "cursorPos",
//                       get: function () {
//                           return this._cursorChanging ? this._changingCursorPos : this.el.selectionEnd;
//                       },
//                       set: function (t) {
//                           this.el.isActive && (this.el.select(t, t), this._saveSelection());
//                       },
//                   },
//               ]),
//               t
//           );
//       })();
//       se.InputMask = ke;
//       var _e = (function (t) {
//           function e() {
//               return jt(this, e), qt(this, zt(e).apply(this, arguments));
//           }
//           return (
//               Ht(e, de),
//               Lt(e, [
//                   {
//                       key: "_update",
//                       value: function (t) {
//                           t.enum && (t.mask = "*".repeat(t.enum[0].length)), Wt(zt(e.prototype), "_update", this).call(this, t);
//                       },
//                   },
//                   {
//                       key: "doValidate",
//                       value: function () {
//                           for (var t, n = this, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
//                           return (
//                               this.enum.some(function (t) {
//                                   return t.indexOf(n.unmaskedValue) >= 0;
//                               }) && (t = Wt(zt(e.prototype), "doValidate", this)).call.apply(t, [this].concat(s))
//                           );
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       se.MaskedEnum = _e;
//       var ye = (function (t) {
//           function e(t) {
//               return jt(this, e), qt(this, zt(e).call(this, Object.assign({}, e.DEFAULTS, {}, t)));
//           }
//           return (
//               Ht(e, ae),
//               Lt(e, [
//                   {
//                       key: "_update",
//                       value: function (t) {
//                           Wt(zt(e.prototype), "_update", this).call(this, t), this._updateRegExps();
//                       },
//                   },
//                   {
//                       key: "_updateRegExps",
//                       value: function () {
//                           var t = "^" + (this.allowNegative ? "[+|\\-]?" : ""),
//                               e = (this.scale ? "(" + te(this.radix) + "\\d{0," + this.scale + "})?" : "") + "$";
//                           (this._numberRegExpInput = new RegExp(t + "(0|([1-9]+\\d*))?" + e)),
//                               (this._numberRegExp = new RegExp(t + "\\d*" + e)),
//                               (this._mapToRadixRegExp = new RegExp("[" + this.mapToRadix.map(te).join("") + "]", "g")),
//                               (this._thousandsSeparatorRegExp = new RegExp(te(this.thousandsSeparator), "g"));
//                       },
//                   },
//                   {
//                       key: "_removeThousandsSeparators",
//                       value: function (t) {
//                           return t.replace(this._thousandsSeparatorRegExp, "");
//                       },
//                   },
//                   {
//                       key: "_insertThousandsSeparators",
//                       value: function (t) {
//                           var e = t.split(this.radix);
//                           return (e[0] = e[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandsSeparator)), e.join(this.radix);
//                       },
//                   },
//                   {
//                       key: "doPrepare",
//                       value: function (t) {
//                           for (var n, i = arguments.length, s = new Array(i > 1 ? i - 1 : 0), a = 1; a < i; a++) s[a - 1] = arguments[a];
//                           return (n = Wt(zt(e.prototype), "doPrepare", this)).call.apply(n, [this, this._removeThousandsSeparators(t.replace(this._mapToRadixRegExp, this.radix))].concat(s));
//                       },
//                   },
//                   {
//                       key: "_separatorsCount",
//                       value: function (t) {
//                           for (var e = arguments.length > 1 && void 0 !== arguments[1] && arguments[1], n = 0, i = 0; i < t; ++i) this._value.indexOf(this.thousandsSeparator, i) === i && (++n, e && (t += this.thousandsSeparator.length));
//                           return n;
//                       },
//                   },
//                   {
//                       key: "_separatorsCountFromSlice",
//                       value: function () {
//                           var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : this._value;
//                           return this._separatorsCount(this._removeThousandsSeparators(t).length, !0);
//                       },
//                   },
//                   {
//                       key: "extractInput",
//                       value: function () {
//                           var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                               n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
//                               i = arguments.length > 2 ? arguments[2] : void 0,
//                               s = Xt(this._adjustRangeWithSeparators(t, n), 2);
//                           return (t = s[0]), (n = s[1]), this._removeThousandsSeparators(Wt(zt(e.prototype), "extractInput", this).call(this, t, n, i));
//                       },
//                   },
//                   {
//                       key: "_appendCharRaw",
//                       value: function (t) {
//                           var n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
//                           if (!this.thousandsSeparator) return Wt(zt(e.prototype), "_appendCharRaw", this).call(this, t, n);
//                           var i = n.tail && n._beforeTailState ? n._beforeTailState._value : this._value,
//                               s = this._separatorsCountFromSlice(i);
//                           this._value = this._removeThousandsSeparators(this.value);
//                           var a = Wt(zt(e.prototype), "_appendCharRaw", this).call(this, t, n);
//                           this._value = this._insertThousandsSeparators(this._value);
//                           var r = n.tail && n._beforeTailState ? n._beforeTailState._value : this._value,
//                               o = this._separatorsCountFromSlice(r);
//                           return (a.tailShift += (o - s) * this.thousandsSeparator.length), a;
//                       },
//                   },
//                   {
//                       key: "_findSeparatorAround",
//                       value: function (t) {
//                           if (this.thousandsSeparator) {
//                               var e = t - this.thousandsSeparator.length + 1,
//                                   n = this.value.indexOf(this.thousandsSeparator, e);
//                               if (n <= t) return n;
//                           }
//                           return -1;
//                       },
//                   },
//                   {
//                       key: "_adjustRangeWithSeparators",
//                       value: function (t, e) {
//                           var n = this._findSeparatorAround(t);
//                           n >= 0 && (t = n);
//                           var i = this._findSeparatorAround(e);
//                           return i >= 0 && (e = i + this.thousandsSeparator.length), [t, e];
//                       },
//                   },
//                   {
//                       key: "remove",
//                       value: function () {
//                           var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0,
//                               e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : this.value.length,
//                               n = Xt(this._adjustRangeWithSeparators(t, e), 2);
//                           (t = n[0]), (e = n[1]);
//                           var i = this.value.slice(0, t),
//                               s = this.value.slice(e),
//                               a = this._separatorsCount(i.length);
//                           this._value = this._insertThousandsSeparators(this._removeThousandsSeparators(i + s));
//                           var r = this._separatorsCountFromSlice(i);
//                           return new ne({ tailShift: (r - a) * this.thousandsSeparator.length });
//                       },
//                   },
//                   {
//                       key: "nearestInputPos",
//                       value: function (t, e) {
//                           if (!this.thousandsSeparator) return t;
//                           switch (e) {
//                               case Qt.NONE:
//                               case Qt.LEFT:
//                               case Qt.FORCE_LEFT:
//                                   var n = this._findSeparatorAround(t - 1);
//                                   if (n >= 0) {
//                                       var i = n + this.thousandsSeparator.length;
//                                       if (t < i || this.value.length <= i || e === Qt.FORCE_LEFT) return n;
//                                   }
//                                   break;
//                               case Qt.RIGHT:
//                               case Qt.FORCE_RIGHT:
//                                   var s = this._findSeparatorAround(t);
//                                   if (s >= 0) return s + this.thousandsSeparator.length;
//                           }
//                           return t;
//                       },
//                   },
//                   {
//                       key: "doValidate",
//                       value: function (t) {
//                           var n = (t.input ? this._numberRegExpInput : this._numberRegExp).test(this._removeThousandsSeparators(this.value));
//                           if (n) {
//                               var i = this.number;
//                               n = n && !isNaN(i) && (null == this.min || this.min >= 0 || this.min <= this.number) && (null == this.max || this.max <= 0 || this.number <= this.max);
//                           }
//                           return n && Wt(zt(e.prototype), "doValidate", this).call(this, t);
//                       },
//                   },
//                   {
//                       key: "doCommit",
//                       value: function () {
//                           if (this.value) {
//                               var t = this.number,
//                                   n = t;
//                               null != this.min && (n = Math.max(n, this.min)), null != this.max && (n = Math.min(n, this.max)), n !== t && (this.unmaskedValue = String(n));
//                               var i = this.value;
//                               this.normalizeZeros && (i = this._normalizeZeros(i)), this.padFractionalZeros && (i = this._padFractionalZeros(i)), (this._value = i);
//                           }
//                           Wt(zt(e.prototype), "doCommit", this).call(this);
//                       },
//                   },
//                   {
//                       key: "_normalizeZeros",
//                       value: function (t) {
//                           var e = this._removeThousandsSeparators(t).split(this.radix);
//                           return (
//                               (e[0] = e[0].replace(/^(\D*)(0*)(\d*)/, function (t, e, n, i) {
//                                   return e + i;
//                               })),
//                               t.length && !/\d$/.test(e[0]) && (e[0] = e[0] + "0"),
//                               e.length > 1 && ((e[1] = e[1].replace(/0*$/, "")), e[1].length || (e.length = 1)),
//                               this._insertThousandsSeparators(e.join(this.radix))
//                           );
//                       },
//                   },
//                   {
//                       key: "_padFractionalZeros",
//                       value: function (t) {
//                           if (!t) return t;
//                           var e = t.split(this.radix);
//                           return e.length < 2 && e.push(""), (e[1] = e[1].padEnd(this.scale, "0")), e.join(this.radix);
//                       },
//                   },
//                   {
//                       key: "unmaskedValue",
//                       get: function () {
//                           return this._removeThousandsSeparators(this._normalizeZeros(this.value)).replace(this.radix, ".");
//                       },
//                       set: function (t) {
//                           Kt(zt(e.prototype), "unmaskedValue", t.replace(".", this.radix), this, !0);
//                       },
//                   },
//                   {
//                       key: "typedValue",
//                       get: function () {
//                           return Number(this.unmaskedValue);
//                       },
//                       set: function (t) {
//                           Kt(zt(e.prototype), "unmaskedValue", String(t), this, !0);
//                       },
//                   },
//                   {
//                       key: "number",
//                       get: function () {
//                           return this.typedValue;
//                       },
//                       set: function (t) {
//                           this.typedValue = t;
//                       },
//                   },
//                   {
//                       key: "allowNegative",
//                       get: function () {
//                           return this.signed || (null != this.min && this.min < 0) || (null != this.max && this.max < 0);
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       (ye.DEFAULTS = { radix: ",", thousandsSeparator: "", mapToRadix: ["."], scale: 2, signed: !1, normalizeZeros: !0, padFractionalZeros: !1 }), (se.MaskedNumber = ye);
//       var be = (function (t) {
//           function e() {
//               return jt(this, e), qt(this, zt(e).apply(this, arguments));
//           }
//           return (
//               Ht(e, ae),
//               Lt(e, [
//                   {
//                       key: "_update",
//                       value: function (t) {
//                           t.mask &&
//                               (t.validate = function (e) {
//                                   return e.search(t.mask) >= 0;
//                               }),
//                               Wt(zt(e.prototype), "_update", this).call(this, t);
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       se.MaskedRegExp = be;
//       var Ce = (function (t) {
//           function e() {
//               return jt(this, e), qt(this, zt(e).apply(this, arguments));
//           }
//           return (
//               Ht(e, ae),
//               Lt(e, [
//                   {
//                       key: "_update",
//                       value: function (t) {
//                           t.mask && (t.validate = t.mask), Wt(zt(e.prototype), "_update", this).call(this, t);
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       se.MaskedFunction = Ce;
//       var Se = (function (t) {
//           function e(t) {
//               var n;
//               return jt(this, e), ((n = qt(this, zt(e).call(this, Object.assign({}, e.DEFAULTS, {}, t)))).currentMask = null), n;
//           }
//           return (
//               Ht(e, ae),
//               Lt(e, [
//                   {
//                       key: "_update",
//                       value: function (t) {
//                           Wt(zt(e.prototype), "_update", this).call(this, t),
//                               "mask" in t &&
//                                   (this.compiledMasks = Array.isArray(t.mask)
//                                       ? t.mask.map(function (t) {
//                                             return oe(t);
//                                         })
//                                       : []);
//                       },
//                   },
//                   {
//                       key: "_appendCharRaw",
//                       value: function () {
//                           var t,
//                               e = this._applyDispatch.apply(this, arguments);
//                           this.currentMask && e.aggregate((t = this.currentMask)._appendChar.apply(t, arguments));
//                           return e;
//                       },
//                   },
//                   {
//                       key: "_applyDispatch",
//                       value: function () {
//                           var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "",
//                               e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
//                               n = e.tail && null != e._beforeTailState ? e._beforeTailState._value : this.value,
//                               i = this.rawInputValue,
//                               s = e.tail && null != e._beforeTailState ? e._beforeTailState._rawInputValue : i,
//                               a = i.slice(s.length),
//                               r = this.currentMask,
//                               o = new ne(),
//                               u = r && r.state;
//                           if (((this.currentMask = this.doDispatch(t, Object.assign({}, e))), this.currentMask))
//                               if (this.currentMask !== r) {
//                                   this.currentMask.reset();
//                                   var l = this.currentMask.append(s, { raw: !0 });
//                                   (o.tailShift = l.inserted.length - n.length), a && (o.tailShift += this.currentMask.append(a, { raw: !0, tail: !0 }).tailShift);
//                               } else this.currentMask.state = u;
//                           return o;
//                       },
//                   },
//                   {
//                       key: "_appendPlaceholder",
//                       value: function () {
//                           var t = this._applyDispatch.apply(this, arguments);
//                           return this.currentMask && t.aggregate(this.currentMask._appendPlaceholder()), t;
//                       },
//                   },
//                   {
//                       key: "doDispatch",
//                       value: function (t) {
//                           var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
//                           return this.dispatch(t, this, e);
//                       },
//                   },
//                   {
//                       key: "doValidate",
//                       value: function () {
//                           for (var t, n, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
//                           return (t = Wt(zt(e.prototype), "doValidate", this)).call.apply(t, [this].concat(s)) && (!this.currentMask || (n = this.currentMask).doValidate.apply(n, s));
//                       },
//                   },
//                   {
//                       key: "reset",
//                       value: function () {
//                           this.currentMask && this.currentMask.reset(),
//                               this.compiledMasks.forEach(function (t) {
//                                   return t.reset();
//                               });
//                       },
//                   },
//                   {
//                       key: "remove",
//                       value: function () {
//                           var t,
//                               e = new ne();
//                           this.currentMask && e.aggregate((t = this.currentMask).remove.apply(t, arguments)).aggregate(this._applyDispatch());
//                           return e;
//                       },
//                   },
//                   {
//                       key: "extractInput",
//                       value: function () {
//                           var t;
//                           return this.currentMask ? (t = this.currentMask).extractInput.apply(t, arguments) : "";
//                       },
//                   },
//                   {
//                       key: "extractTail",
//                       value: function () {
//                           for (var t, n, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
//                           return this.currentMask ? (t = this.currentMask).extractTail.apply(t, s) : (n = Wt(zt(e.prototype), "extractTail", this)).call.apply(n, [this].concat(s));
//                       },
//                   },
//                   {
//                       key: "doCommit",
//                       value: function () {
//                           this.currentMask && this.currentMask.doCommit(), Wt(zt(e.prototype), "doCommit", this).call(this);
//                       },
//                   },
//                   {
//                       key: "nearestInputPos",
//                       value: function () {
//                           for (var t, n, i = arguments.length, s = new Array(i), a = 0; a < i; a++) s[a] = arguments[a];
//                           return this.currentMask ? (t = this.currentMask).nearestInputPos.apply(t, s) : (n = Wt(zt(e.prototype), "nearestInputPos", this)).call.apply(n, [this].concat(s));
//                       },
//                   },
//                   {
//                       key: "value",
//                       get: function () {
//                           return this.currentMask ? this.currentMask.value : "";
//                       },
//                       set: function (t) {
//                           Kt(zt(e.prototype), "value", t, this, !0);
//                       },
//                   },
//                   {
//                       key: "unmaskedValue",
//                       get: function () {
//                           return this.currentMask ? this.currentMask.unmaskedValue : "";
//                       },
//                       set: function (t) {
//                           Kt(zt(e.prototype), "unmaskedValue", t, this, !0);
//                       },
//                   },
//                   {
//                       key: "typedValue",
//                       get: function () {
//                           return this.currentMask ? this.currentMask.typedValue : "";
//                       },
//                       set: function (t) {
//                           var e = String(t);
//                           this.currentMask && ((this.currentMask.typedValue = t), (e = this.currentMask.unmaskedValue)), (this.unmaskedValue = e);
//                       },
//                   },
//                   {
//                       key: "isComplete",
//                       get: function () {
//                           return !!this.currentMask && this.currentMask.isComplete;
//                       },
//                   },
//                   {
//                       key: "state",
//                       get: function () {
//                           return Object.assign({}, Wt(zt(e.prototype), "state", this), {
//                               _rawInputValue: this.rawInputValue,
//                               compiledMasks: this.compiledMasks.map(function (t) {
//                                   return t.state;
//                               }),
//                               currentMaskRef: this.currentMask,
//                               currentMask: this.currentMask && this.currentMask.state,
//                           });
//                       },
//                       set: function (t) {
//                           var n = t.compiledMasks,
//                               i = t.currentMaskRef,
//                               s = t.currentMask,
//                               a = Yt(t, ["compiledMasks", "currentMaskRef", "currentMask"]);
//                           this.compiledMasks.forEach(function (t, e) {
//                               return (t.state = n[e]);
//                           }),
//                               null != i && ((this.currentMask = i), (this.currentMask.state = s)),
//                               Kt(zt(e.prototype), "state", a, this, !0);
//                       },
//                   },
//                   {
//                       key: "overwrite",
//                       get: function () {
//                           return this.currentMask ? this.currentMask.overwrite : Wt(zt(e.prototype), "overwrite", this);
//                       },
//                       set: function (t) {
//                           console.warn('"overwrite" option is not available in dynamic mask, use this option in siblings');
//                       },
//                   },
//               ]),
//               e
//           );
//       })();
//       (Se.DEFAULTS = {
//           dispatch: function (t, e, n) {
//               if (e.compiledMasks.length) {
//                   var i = e.rawInputValue,
//                       s = e.compiledMasks.map(function (e, s) {
//                           return e.reset(), e.append(i, { raw: !0 }), e.append(t, n), { weight: e.rawInputValue.length, index: s };
//                       });
//                   return (
//                       s.sort(function (t, e) {
//                           return e.weight - t.weight;
//                       }),
//                       e.compiledMasks[s[0].index]
//                   );
//               }
//           },
//       }),
//           (se.MaskedDynamic = Se);
//       var Ee = { MASKED: "value", UNMASKED: "unmaskedValue", TYPED: "typedValue" };
//       function Ae(t) {
//           var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : Ee.MASKED,
//               n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : Ee.MASKED,
//               i = oe(t);
//           return function (t) {
//               return i.runIsolated(function (i) {
//                   return (i[e] = t), i[n];
//               });
//           };
//       }
//       function Fe(t) {
//           for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), i = 1; i < e; i++) n[i - 1] = arguments[i];
//           return Ae.apply(void 0, n)(t);
//       }
//       (se.PIPE_TYPE = Ee),
//           (se.createPipe = Ae),
//           (se.pipe = Fe),
//           (globalThis.IMask = se),
//           (t.HTMLContenteditableMaskElement = me),
//           (t.HTMLMaskElement = ge),
//           (t.InputMask = ke),
//           (t.MaskElement = ve),
//           (t.Masked = ae),
//           (t.MaskedDate = fe),
//           (t.MaskedDynamic = Se),
//           (t.MaskedEnum = _e),
//           (t.MaskedFunction = Ce),
//           (t.MaskedNumber = ye),
//           (t.MaskedPattern = de),
//           (t.MaskedRange = pe),
//           (t.MaskedRegExp = be),
//           (t.PIPE_TYPE = Ee),
//           (t.createMask = oe),
//           (t.createPipe = Ae),
//           (t.default = se),
//           (t.pipe = Fe),
//           Object.defineProperty(t, "__esModule", { value: !0 });
//   }),
//   (function (t) {
//       "function" == typeof define && define.amd
//           ? define(["jquery"], function (e) {
//                 return t(e, window, document);
//             })
//           : "object" == typeof exports
//           ? (module.exports = t(require("jquery"), window, document))
//           : t($, window, document);
//   })(function (t, e, n) {
//       "use strict";
//       var i, s, a, r, o, u, l, h, c, d, p, f, v, g, m, k, _, y, b, C;
//       (v = {
//           paneClass: "nano-pane",
//           sliderClass: "nano-slider",
//           contentClass: "nano-content",
//           enabledClass: "has-scrollbar",
//           flashedClass: "flashed",
//           activeClass: "active",
//           iOSNativeScrolling: !1,
//           preventPageScrolling: !1,
//           disableResize: !1,
//           alwaysVisible: !1,
//           flashDelay: 1500,
//           sliderMinHeight: 20,
//           sliderMaxHeight: null,
//           documentContext: null,
//           windowContext: null,
//       }),
//           (d = "scroll"),
//           (r = "mousedown"),
//           (o = "mouseenter"),
//           (u = "mousemove"),
//           (l = "mousewheel"),
//           (c = "resize"),
//           (a = "DOMMouseScroll"),
//           (p = "touchmove"),
//           (i = "Microsoft Internet Explorer" === e.navigator.appName && /msie 7./i.test(e.navigator.appVersion) && e.ActiveXObject),
//           (s = null),
//           (_ = e.requestAnimationFrame),
//           (f = e.cancelAnimationFrame),
//           (b = n.createElement("div").style),
//           (C = (function () {
//               var t, e, n, i;
//               for (t = n = 0, i = (e = ["t", "webkitT", "MozT", "msT", "OT"]).length; i > n; t = ++n) if ((e[t], e[t] + "ransform" in b)) return e[t].substr(0, e[t].length - 1);
//               return !1;
//           })()),
//           (y = (function (t) {
//               return !1 !== C && ("" === C ? t : C + t.charAt(0).toUpperCase() + t.substr(1));
//           })("transform")),
//           (m = !1 !== y),
//           (g = function () {
//               var t, e, i;
//               return (
//                   ((e = (t = n.createElement("div")).style).position = "absolute"),
//                   (e.width = "100px"),
//                   (e.height = "100px"),
//                   (e.overflow = d),
//                   (e.top = "-9999px"),
//                   n.body.appendChild(t),
//                   (i = t.offsetWidth - t.clientWidth),
//                   n.body.removeChild(t),
//                   i
//               );
//           }),
//           (k = function () {
//               var t, n, i;
//               return (n = e.navigator.userAgent), !!(t = /(?=.+Mac OS X)(?=.+Firefox)/.test(n)) && ((i = /Firefox\/\d{2}\./.exec(n)) && (i = i[0].replace(/\D+/g, "")), t && +i > 23);
//           }),
//           (h = (function () {
//               function h(i, a) {
//                   (this.el = i),
//                       (this.options = a),
//                       s || (s = g()),
//                       (this.$el = t(this.el)),
//                       (this.doc = t(this.options.documentContext || n)),
//                       (this.win = t(this.options.windowContext || e)),
//                       (this.body = this.doc.find("body")),
//                       (this.$content = this.$el.children("." + this.options.contentClass)),
//                       this.$content.attr("tabindex", this.options.tabIndex || 0),
//                       (this.content = this.$content[0]),
//                       (this.previousPosition = 0),
//                       this.options.iOSNativeScrolling && null != this.el.style.WebkitOverflowScrolling ? this.nativeScrolling() : this.generate(),
//                       this.createEvents(),
//                       this.addEvents(),
//                       this.reset();
//               }
//               return (
//                   (h.prototype.preventScrolling = function (t, e) {
//                       if (this.isActive)
//                           if (t.type === a) (("down" === e && t.originalEvent.detail > 0) || ("up" === e && t.originalEvent.detail < 0)) && t.preventDefault();
//                           else if (t.type === l) {
//                               if (!t.originalEvent || !t.originalEvent.wheelDelta) return;
//                               (("down" === e && t.originalEvent.wheelDelta < 0) || ("up" === e && t.originalEvent.wheelDelta > 0)) && t.preventDefault();
//                           }
//                   }),
//                   (h.prototype.nativeScrolling = function () {
//                       this.$content.css({ WebkitOverflowScrolling: "touch" }), (this.iOSNativeScrolling = !0), (this.isActive = !0);
//                   }),
//                   (h.prototype.updateScrollValues = function () {
//                       var t, e;
//                       (t = this.content),
//                           (this.maxScrollTop = t.scrollHeight - t.clientHeight),
//                           (this.prevScrollTop = this.contentScrollTop || 0),
//                           (this.contentScrollTop = t.scrollTop),
//                           (e = this.contentScrollTop > this.previousPosition ? "down" : this.contentScrollTop < this.previousPosition ? "up" : "same"),
//                           (this.previousPosition = this.contentScrollTop),
//                           "same" !== e && this.$el.trigger("update", { position: this.contentScrollTop, maximum: this.maxScrollTop, direction: e }),
//                           this.iOSNativeScrolling || ((this.maxSliderTop = this.paneHeight - this.sliderHeight), (this.sliderTop = 0 === this.maxScrollTop ? 0 : (this.contentScrollTop * this.maxSliderTop) / this.maxScrollTop));
//                   }),
//                   (h.prototype.setOnScrollStyles = function () {
//                       var t, e;
//                       m ? ((t = {})[y] = "translate(0, " + this.sliderTop + "px)") : (t = { top: this.sliderTop }),
//                           _
//                               ? (f && this.scrollRAF && f(this.scrollRAF),
//                                 (this.scrollRAF = _(
//                                     ((e = this),
//                                     function () {
//                                         return (e.scrollRAF = null), e.slider.css(t);
//                                     })
//                                 )))
//                               : this.slider.css(t);
//                   }),
//                   (h.prototype.createEvents = function () {
//                       var t;
//                       this.events = {
//                           down:
//                               ((t = this),
//                               function (e) {
//                                   return (
//                                       (t.isBeingDragged = !0),
//                                       (t.offsetY = e.pageY - t.slider.offset().top),
//                                       t.slider.is(e.target) || (t.offsetY = 0),
//                                       t.pane.addClass(t.options.activeClass),
//                                       t.doc.bind(u, t.events.drag).bind("mouseup", t.events.up),
//                                       t.body.bind(o, t.events.enter),
//                                       !1
//                                   );
//                               }),
//                           drag: (function (t) {
//                               return function (e) {
//                                   return (
//                                       (t.sliderY = e.pageY - t.$el.offset().top - t.paneTop - (t.offsetY || 0.5 * t.sliderHeight)),
//                                       t.scroll(),
//                                       t.contentScrollTop >= t.maxScrollTop && t.prevScrollTop !== t.maxScrollTop ? t.$el.trigger("scrollend") : 0 === t.contentScrollTop && 0 !== t.prevScrollTop && t.$el.trigger("scrolltop"),
//                                       !1
//                                   );
//                               };
//                           })(this),
//                           up: (function (t) {
//                               return function (e) {
//                                   return (t.isBeingDragged = !1), t.pane.removeClass(t.options.activeClass), t.doc.unbind(u, t.events.drag).unbind("mouseup", t.events.up), t.body.unbind(o, t.events.enter), !1;
//                               };
//                           })(this),
//                           resize: (function (t) {
//                               return function (e) {
//                                   t.reset();
//                               };
//                           })(this),
//                           panedown: (function (t) {
//                               return function (e) {
//                                   return (t.sliderY = (e.offsetY || e.originalEvent.layerY) - 0.5 * t.sliderHeight), t.scroll(), t.events.down(e), !1;
//                               };
//                           })(this),
//                           scroll: (function (t) {
//                               return function (e) {
//                                   t.updateScrollValues(),
//                                       t.isBeingDragged ||
//                                           (t.iOSNativeScrolling || ((t.sliderY = t.sliderTop), t.setOnScrollStyles()),
//                                           null != e &&
//                                               (t.contentScrollTop >= t.maxScrollTop
//                                                   ? (t.options.preventPageScrolling && t.preventScrolling(e, "down"), t.prevScrollTop !== t.maxScrollTop && t.$el.trigger("scrollend"))
//                                                   : 0 === t.contentScrollTop && (t.options.preventPageScrolling && t.preventScrolling(e, "up"), 0 !== t.prevScrollTop && t.$el.trigger("scrolltop"))));
//                               };
//                           })(this),
//                           wheel: (function (t) {
//                               return function (e) {
//                                   var n;
//                                   if (null != e)
//                                       return (n = e.delta || e.wheelDelta || (e.originalEvent && e.originalEvent.wheelDelta) || -e.detail || (e.originalEvent && -e.originalEvent.detail)) && (t.sliderY += -n / 3), t.scroll(), !1;
//                               };
//                           })(this),
//                           enter: (function (t) {
//                               return function (e) {
//                                   var n;
//                                   if (t.isBeingDragged) return 1 !== (e.buttons || e.which) ? (n = t.events).up.apply(n, arguments) : void 0;
//                               };
//                           })(this),
//                       };
//                   }),
//                   (h.prototype.addEvents = function () {
//                       var t;
//                       this.removeEvents(),
//                           (t = this.events),
//                           this.options.disableResize || this.win.bind(c, t[c]),
//                           this.iOSNativeScrolling || (this.slider.bind(r, t.down), this.pane.bind(r, t.panedown).bind(l + " " + a, t.wheel)),
//                           this.$content.bind(d + " " + l + " " + a + " " + p, t[d]);
//                   }),
//                   (h.prototype.removeEvents = function () {
//                       var t;
//                       (t = this.events), this.win.unbind(c, t[c]), this.iOSNativeScrolling || (this.slider.unbind(), this.pane.unbind()), this.$content.unbind(d + " " + l + " " + a + " " + p, t[d]);
//                   }),
//                   (h.prototype.generate = function () {
//                       var t, n, i, a, r;
//                       return (
//                           (a = (n = this.options).paneClass),
//                           (r = n.sliderClass),
//                           n.contentClass,
//                           (i = this.$el.children("." + a)).length || i.children("." + r).length || this.$el.append('<div class="' + a + '"><div class="' + r + '" /></div>'),
//                           (this.pane = this.$el.children("." + a)),
//                           (this.slider = this.pane.find("." + r)),
//                           0 === s && k()
//                               ? (t = {
//                                     right: -14,
//                                     paddingRight:
//                                         +e
//                                             .getComputedStyle(this.content, null)
//                                             .getPropertyValue("padding-right")
//                                             .replace(/[^0-9.]+/g, "") + 14,
//                                 })
//                               : s && ((t = { right: -s }), this.$el.addClass(n.enabledClass)),
//                           null != t && this.$content.css(t),
//                           this
//                       );
//                   }),
//                   (h.prototype.restore = function () {
//                       (this.stopped = !1), this.iOSNativeScrolling || this.pane.show(), this.addEvents();
//                   }),
//                   (h.prototype.reset = function () {
//                       var t, e, n, a, r, o, u, l, h, c, p;
//                       return this.iOSNativeScrolling
//                           ? void (this.contentHeight = this.content.scrollHeight)
//                           : (this.$el.find("." + this.options.paneClass).length || this.generate().stop(),
//                             this.stopped && this.restore(),
//                             (r = (a = (t = this.content).style).overflowY),
//                             i && this.$content.css({ height: this.$content.height() }),
//                             (e = t.scrollHeight + s),
//                             (h = parseInt(this.$el.css("max-height"), 10)) > 0 && (this.$el.height(""), this.$el.height(t.scrollHeight > h ? h : t.scrollHeight)),
//                             (u = (o = this.pane.outerHeight(!1)) + (l = parseInt(this.pane.css("top"), 10)) + parseInt(this.pane.css("bottom"), 10)),
//                             (p = Math.round((u / e) * o)) < this.options.sliderMinHeight
//                                 ? (p = this.options.sliderMinHeight)
//                                 : null != this.options.sliderMaxHeight && p > this.options.sliderMaxHeight && (p = this.options.sliderMaxHeight),
//                             r === d && a.overflowX !== d && (p += s),
//                             (this.maxSliderTop = u - p),
//                             (this.contentHeight = e),
//                             (this.paneHeight = o),
//                             (this.paneOuterHeight = u),
//                             (this.sliderHeight = p),
//                             (this.paneTop = l),
//                             this.slider.height(p),
//                             this.events.scroll(),
//                             this.pane.show(),
//                             (this.isActive = !0),
//                             t.scrollHeight === t.clientHeight || (this.pane.outerHeight(!0) >= t.scrollHeight && r !== d)
//                                 ? (this.pane.hide(), (this.isActive = !1))
//                                 : this.el.clientHeight === t.scrollHeight && r === d
//                                 ? this.slider.hide()
//                                 : this.slider.show(),
//                             this.pane.css({ opacity: this.options.alwaysVisible ? 1 : "", visibility: this.options.alwaysVisible ? "visible" : "" }),
//                             ("static" === (n = this.$content.css("position")) || "relative" === n) && (c = parseInt(this.$content.css("right"), 10)) && this.$content.css({ right: "", marginRight: c }),
//                             this);
//                   }),
//                   (h.prototype.scroll = function () {
//                       return this.isActive
//                           ? ((this.sliderY = Math.max(0, this.sliderY)),
//                             (this.sliderY = Math.min(this.maxSliderTop, this.sliderY)),
//                             this.$content.scrollTop((this.maxScrollTop * this.sliderY) / this.maxSliderTop),
//                             this.iOSNativeScrolling || (this.updateScrollValues(), this.setOnScrollStyles()),
//                             this)
//                           : void 0;
//                   }),
//                   (h.prototype.scrollBottom = function (t) {
//                       return this.isActive ? (this.$content.scrollTop(this.contentHeight - this.$content.height() - t).trigger(l), this.stop().restore(), this) : void 0;
//                   }),
//                   (h.prototype.scrollTop = function (t) {
//                       return this.isActive ? (this.$content.scrollTop(+t).trigger(l), this.stop().restore(), this) : void 0;
//                   }),
//                   (h.prototype.scrollTo = function (t) {
//                       return this.isActive ? (this.scrollTop(this.$el.find(t).get(0).offsetTop), this) : void 0;
//                   }),
//                   (h.prototype.stop = function () {
//                       return f && this.scrollRAF && (f(this.scrollRAF), (this.scrollRAF = null)), (this.stopped = !0), this.removeEvents(), this.iOSNativeScrolling || this.pane.hide(), this;
//                   }),
//                   (h.prototype.destroy = function () {
//                       return (
//                           this.stopped || this.stop(),
//                           !this.iOSNativeScrolling && this.pane.length && this.pane.remove(),
//                           i && this.$content.height(""),
//                           this.$content.removeAttr("tabindex"),
//                           this.$el.hasClass(this.options.enabledClass) && (this.$el.removeClass(this.options.enabledClass), this.$content.css({ right: "" })),
//                           this
//                       );
//                   }),
//                   (h.prototype.flash = function () {
//                       return !this.iOSNativeScrolling && this.isActive
//                           ? (this.reset(),
//                             this.pane.addClass(this.options.flashedClass),
//                             setTimeout(
//                                 ((t = this),
//                                 function () {
//                                     t.pane.removeClass(t.options.flashedClass);
//                                 }),
//                                 this.options.flashDelay
//                             ),
//                             this)
//                           : void 0;
//                       var t;
//                   }),
//                   h
//               );
//           })()),
//           (t.fn.nanoScroller = function (e) {
//               return this.each(function () {
//                   var n, i;
//                   if (((i = this.nanoscroller) || ((n = t.extend({}, v, e)), (this.nanoscroller = i = new h(this, n))), e && "object" == typeof e)) {
//                       if ((t.extend(i.options, e), null != e.scrollBottom)) return i.scrollBottom(e.scrollBottom);
//                       if (null != e.scrollTop) return i.scrollTop(e.scrollTop);
//                       if (e.scrollTo) return i.scrollTo(e.scrollTo);
//                       if ("bottom" === e.scroll) return i.scrollBottom(0);
//                       if ("top" === e.scroll) return i.scrollTop(0);
//                       if (e.scroll && e.scroll instanceof t) return i.scrollTo(e.scroll);
//                       if (e.stop) return i.stop();
//                       if (e.destroy) return i.destroy();
//                       if (e.flash) return i.flash();
//                   }
//                   return i.reset();
//               });
//           }),
//           (t.fn.nanoScroller.Constructor = h);
//   });
  
  