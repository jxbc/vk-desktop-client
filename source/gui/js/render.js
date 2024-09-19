let THIS;

class Render {

	constructor() {
		if(THIS == null) {
			THIS = this
		}
	}

	async profile(id) {
		//Cutted builder (Babel)
	}

	group(id) {

	}

	audios() {

	}

	async messages() {
		let poll = await import('./modules/messages.js')
		poll.startPolling()
		storage.path = 'messanger'
	}

	async next() {
		window.vkc.rpc('render', 'template')
		window.vkc.createTempDir()
		return 1;
	}

	build = {
		createDisplay: function() {
			//Cutted builder (Babel)
		},
		popupWindow: function(context) {
			let html = `<div class="popupWindow">${context}</div>`
			document.querySelector('#appContainer').insertAdjacentHTML('beforeend', html)
			document.querySelector('.popupWindow').addEventListener('click', e => {
				if(e.target == document.querySelector('.backDrop')) {
					document.querySelector('.popupWindow').remove()
				}
			})
			return document.querySelector('.popupWindow')
		},
		mediaView: function(context) {
			let html = `
			<div class="flex w:max h:max align:center justify:center backDrop">
				<img src="${context}" style="max-height: 91vh; max-width: 100vw;">
			</div>`
			return html
		},
		settings: function(context) {
			let html = `<div class="flex w:max h:max align:center justify:center backDrop">
				<div class="popup settings">
					<div class="popup_header flex">
						<div class="title">Настройки</div>
						<div class="icon close icon:zap"></div>
					</div>
					<div class="settingsContent">${context}</div>
				</div>
			</div>`
			return html
		},
		blueSpan: function(context) {
			return `<span style='color:var(--block_name_header);'>${context}</span>`
		},
		drawHTML: function(context) {
			let doc = document.querySelector('.content')
			doc.insertAdjacentHTML('beforeend', context)
		},
		drawHTMLAfter: function(context) {
			let doc = document.querySelector('.content')
			doc.insertAdjacentHTML('afterbegin', context)
		},
		removeHTML: function(context) {
			let doc = document.querySelector(context)
			doc.remove()
		},
		checkHTML: function(context) {
			let html = document.querySelector(context)
			if(html) return true;
			else if(!html) return false;
		},
		createMenuProfile: function(img) {
			let code = `<div class="icon icon:wh:42 menuAvatar" style="background-image: url(${img})"></div>`
			let menu = document.querySelector('.menuButton.profile')
			menu.insertAdjacentHTML('afterbegin', code)
		},
		div: function(context) {
			return `<div style="padding: 4px 0;">${context}</div>`
		},
		createProgressBar: function(context) {
			let html = `
			<div class="progressive_bar">
										<div class="stateProgress">
											<div class="percent">
												<div class="progressive" style="width:0%"></div>
											</div>
											<div class="name">${context}</div>
										</div>
									</div>
			`
			document.querySelector('.messages_footer').insertAdjacentHTML('afterbegin', html)
		},
		setProgress: function(percent) {
			let pr = document.querySelector('.stateProgress .percent .progressive')
			pr.setAttribute('style', `width: ${percent}%;`)
		},
		setProgressName: function(val) {
			let pr = document.querySelector('.stateProgress .name')
			pr.innerHTML = val
		},
		removeProgressBar: function(percent) {
			let pr = document.querySelector('.progressive_bar')
			pr.remove()
		},
		profile: {
			createProfileBlock: function(context) {
				let html = `<div class="contentBlock" id="interface_profile">${context}</div>`
				THIS.build.drawHTMLAfter(html)
			},
			block1: function(context) {
				let html = `<div class="block_name_header">${context.username}</div>
						<div class="profile_extends flex justify:between align:center">
							<div class="profile_info_base">
								<div class="profile_info_fl fsize:24 fweight:bold">${context.first} ${context.last}</div>
								<div class="profile_info_st">${context.status}</div>
							</div>
							<div class="profile_info_avatar">
								<div class="profile_avatar icon:wh:128" style="background-image: url(${context.avatar});"></div>
							</div>
						</div>`
				return html;
			}
			//Cutted builder (Babel)
		},
		mss: {
			createMessagesInterface: function(context) {},
			moveDialog: function(dig) {
				let dialogs = document.querySelector('.dialogs')
				let move = document.querySelector('#dialog'+dig)
				let pinned = dialogs.querySelector('.pinDialogs')

				if(move && move != pinned) {
					dialogs.insertBefore(move, pinned.nextSibling);
				}
			},
			input: function(context) {
				return document.querySelector(".messanger_input")
			},
			pins: function() {
				return document.querySelector('.dialogs').insertAdjacentHTML('beforeend', `<div class="pinDialogs"></div>`)
			},
			code: function(context) {
				if(context.name) {
					return `<div class="codeInput"><div class="title__char">${context.name}</div>${context.code}<div class="copyCode">копировать</div></div>`
				}
				return `<div class="codeInput">${context}<div class="copyCode">копировать</div></div>`
			},
			replyMessage: function(context) {
				return `<div class="reply" msgid="${context.id}">${context.message}</div>	`
			},
			dialogPinned: function(context) {
				return document.querySelector('.pinDialogs').insertAdjacentHTML('beforeend', `<div class="dialog" unread="${context.unread}" dialog="${context.dialog}" name="${context.name}" id="dialog${context.dialog}">
									<div class="avtr" online="${context.online}" style="background-image:url(${context.avatar})"></div>
									<div class="namesinfo">
										<div class="name">${context.name}</div>
										<div class="lastmessage">${context.last}</div>
									</div>
									<div class="actions"></div>
								</div>`)
			},
			dialog: function(context) {
				return document.querySelector('.dialogs').insertAdjacentHTML('beforeend', `<div class="dialog" unread="${context.unread}" dialog="${context.dialog}" name="${context.name}" id="dialog${context.dialog}">
									<div class="avtr" online="${context.online}" style="background-image:url(${context.avatar})"></div>
									<div class="namesinfo">
										<div class="name">${context.name}</div>
										<div class="lastmessage">${context.last}</div>
									</div>
									<div class="actions"></div>
								</div>`)
			},
			messageBlock: function(context) {
				return `<div class="message" id="im${context.random}">${context.html}</div>`
			},
			messageBlockOut: function(context) {
				return `<div class="message out" id="im${context.random}">${context.html}</div>`
			},
			message: function(context, reply = 0) {
				let hide = context.avatarHidden ? "visibility: hidden;" : ""
				let hideName = context.avatarHidden ? "display: none;" : ""
				if(reply) {
					return THIS.build.mss.messageBlock({html:`<div class="__group posab opacity0" id="mid${context.random}"><div class="avva" style="background-image: url(${context.avatar}); ${hide}"></div>
											<div class="msgblock">
												<div class="nickname" style="${hideName}">${context.nickname}</div>
												<div class="reply" from="${reply.from}">
													<div>${reply.name}</div>
													<div>${reply.text}</div>
												</div>
												<div class="text">
													<div class="text">${context.textMedia}</div>
													<div class="time">${context.time}</div>
												</div>
											</div></div>`, random: context.random})
				}
				return THIS.build.mss.messageBlock({html:`<div class="__group posab opacity0" id="mid${context.random}"><div class="avva" style="background-image: url(${context.avatar}); ${hide}"></div>
											<div class="msgblock">
												<div class="nickname" style="${hideName}">${context.nickname}</div>
												<div class="text">
													<div class="text">${context.textMedia}</div>
													<div class="time">${context.time}</div>
												</div>
											</div></div>`, random: context.random})
			},
			messageSimple: function(context, reply = 0) {
				let hide = context.avatarHidden ? "visibility: hidden;" : ""
				let hideName = context.avatarHidden ? "display: none;" : ""
				if(reply) {
					return THIS.build.mss.messageBlock({html:`<div class="__group" id="mid${context.random}"><div class="avva" style="background-image: url(${context.avatar}); ${hide}"></div>
											<div class="msgblock" >
												<div class="nickname" style="${hideName}">${context.nickname}</div>
												<div class="reply" from="${reply.from}">
													<div>${reply.name}</div>
													<div>${reply.text}</div>
												</div>
												<div class="text">
													<div class="text">${context.textMedia}</div>
													<div class="time">${context.time}</div>
												</div>
											</div></div>`, random: context.random})
				}
				return THIS.build.mss.messageBlock({html:`<div class="__group" id="mid${context.random}"><div class="avva" style="background-image: url(${context.avatar}); ${hide}"></div>
											<div class="msgblock">
												<div class="nickname" style="${hideName}">${context.nickname}</div>
												<div class="text">
													<div class="text">${context.textMedia}</div>
													<div class="time">${context.time}</div>
												</div>
											</div></div>`, random: context.random})
			},
			messageOut: function(context, reply = 0) {
				if(reply) {
					return THIS.build.mss.messageBlockOut({html:`<div class="__group posab opacity0" checked="${context.check}" id="mid${context.random}">
											<div class="msgblock" time="${context.time}">
												<div class="reply">${reply}</div>
												<div class="text">${context.textMedia}</div>
											</div></div>`, random: context.random})
				}
				return THIS.build.mss.messageBlockOut({html:`<div class="__group posab opacity0" checked="${context.check}" id="mid${context.random}">
											<div class="msgblock" time="${context.time}">
												<div class="text">${context.textMedia}</div>
											</div></div>`, random: context.random})
			},
			messageOutSimple: function(context) {
				return THIS.build.mss.messageBlockOut({html:`<div class="__group" checked="${context.check}" id="mid${context.random}">
											<div class="msgblock" time="${context.time}">
												<div class="text">${context.textMedia}</div>
											</div></div>`, random: context.random})
			},
			attachmentList: function(context) {
				let html = `
				<div class="attachList list">
					<label class="listProp button" type="voiceAttach" for="voiceAttachInput"><span class="icon icon:wh:1416 icon:mic svg:blue icon:fix" style="margin-right: 4px;"></span>Аудиосообщение</label>
					<input type="file" style="display:none;" id="voiceAttachInput">
				</div>
				`
				context.insertAdjacentHTML('afterbegin', html)
			}
		},
		plus: {
			createConverter: async function(server) {
				await require('converter')
				let html = converter.get_html()
				THIS.build.drawHTML(html)
				converter.start()
			}
		},
		utils: {
			createPopupWindow: function(context) {}
		}
	}
}