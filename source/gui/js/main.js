let storage = window.localStorage;
let vk = new VK();
let render = new Render();
let abortController = new AbortController();
let locate = window.location.pathname;
locate = locate.substring(locate.lastIndexOf('/')+1);

let SETTINGS = { lp: 0, throttle: 0, msg_slow_mode: 1  }

async function main() {
	windowControllers()
	if(!storage.token) {
		if(locate != 'start.html') return window.location.href = 'start.html'
		authScreen()
	}
	else
	{
		if(locate != 'template.html') return render.next()
		loadStorage()
		vk = new VK(storage.token)
		await checkToken()
		loadMenu()
		render.messages()
		process_worker()
	}

	hotKeys()
}

function hotKeys() {
	let zoom = 0;
	let mouse = 0;

	window.addEventListener('keypress', async k => {
		if(k.ctrlKey == true && k.code == "KeyQ") {
			k.preventDefault()
			if(zoom) {
				mouse = 0;
				document.querySelector('html').setAttribute('style', '')
				zoom = 0;
			} else {
				mouse = 1;
				document.querySelector('html').setAttribute('style', 'scale: 1.25;transform: translate(-22%, 3%)')
				zoom = 1;
			}
		}
	})
	window.addEventListener('mousemove', o => {
		if(mouse) {
			let x = o.layerX - 100
			let y = o.layerY - 100
			document.querySelector('html').setAttribute('style', `scale: 1.25;transform: translate(${x}px, ${y}px)`)
		}
	})

}

async function Router(path) {
	if(storage.path) {
		if(storage.path == 'profile'+path)
		{
			if(render.build.checkHTML('#interface_profile')) {
				render.build.removeHTML('#interface_profile')
			}
		}
		else if(path > 0) {
			if(render.build.checkHTML('#interface_profile')) {
				render.build.removeHTML('#interface_profile')
			}
		}
	}
	let usr = await vk.call('users.get', {user_ids: path, fields: 'screen_name,status,photo_200'})
	let data = `${usr.id} / ${usr.first_name} <div class="h1">${usr.last_name}</div>`
	storage.setItem('path', `profile${path}`)

	render.build.profile.createProfileBlock(render.build.profile.block1({
		avatar: usr.photo_200,
		first: usr.first_name,
		last: usr.last_name,
		username: usr.screen_name,
		status: usr.status
	}))
}

function process_worker() {
	window.addEventListener('blur', event => {
		SETTINGS.msg_slow_mode = 0
		//window.vkc.rpc('action', {type: 'min'})
	})
	window.addEventListener('focus', event => {
		SETTINGS.msg_slow_mode = 1
		//window.vkc.rpc('action', {type: 'minmax'})
	})
}

async function authScreen() {
	let icon = document.querySelector('.logo')
	let authForm = document.querySelector('.authForm')
	let nite = document.querySelector('.nite')
	let lands = document.querySelectorAll('.form.lands')
	let buttonToken = document.querySelector('.loginWithToken')
	let buttonAuthToken = document.querySelector('.buttonAuthToken')
	let buttonAuthLogin = document.querySelector('.buttonAuthLogin')
	let formNumberPhone = document.querySelector('.formLogin')
	let formPassword = document.querySelector('.formPassword')
	let formToken = document.querySelector('.formToken')

	authForm.classList.add('display:0')

	await next(2000)

	icon.classList.remove('icon:wh:128')
	icon.classList.add('icon:wh:64')

	nite.classList.remove('fsize:50')
	nite.classList.add('fsize:24')

	await next(500)

	authForm.classList.remove('display:0')
	lands[0].classList.remove('display:0')

	buttonToken.addEventListener('click', e => {
		lands[1].classList.remove('display:0')
		lands[0].classList.add('display:0')
	})
	buttonAuthToken.addEventListener('click', async e => {
		vk = new VK(formToken.value)

		let check = await vk.call('users.get', {fields: 'photo_100'})

		console.log(check)

		if(check.error) {
			return createAlert('Ошибка', check.error)
		}

		storage.setItem('token', formToken.value)
		storage.setItem('id', check.id)
		createAlert(`${check.first_name} ${check.last_name}`, `Успешная авторизация`, check.photo_100)
		await next(2500)
		render.next()
	})
	buttonAuthLogin.addEventListener('click', async e => {
		let auth = await vk.auth(formNumberPhone.value, formPassword.value)

		if(auth.error) {
			if(auth.error == "need_validation")
			{
				createAlert('2FA error', 'Невозможно войти в аккаунт')
			}
			if(auth.error == "need_captcha")
			{
				createAlert('Captcha error', 'С вашего IP исходит слишком много запросов')
			}
		}

		storage.setItem('token', auth.access_token)
		storage.setItem('id', auth.user_id)
		vk = new VK(auth.access_token)
		
		let json = await vk.call('users.get', {fields: 'photo_100'})
		createAlert(`${json.first_name} ${json.last_name}`, `Успешная авторизация`, json.photo_100)
		await next(2500)
		render.next()
	})
}

function windowControllers() {
	let win = [document.querySelector("#windowHide"), document.querySelector("#windowMax"), document.querySelector("#windowClose")]
	win[0].addEventListener('click', e => {
		window.vkc.rpc('action', 'hide')
	})
	win[1].addEventListener('click', e => {
		window.vkc.rpc('action', 'max')
	})
	win[2].addEventListener('click', e => {
		window.vkc.rpc('action', 'close')
	})
}

async function createAlert(title, text, icon = null) {
	let push = new Audio('./others/push.mp3')
	let photo = icon ? `background-image: url(${icon})` : '';
	let rand = getRandomInt(100, 999)
	if(text.length > 20) {
		if(text.indexOf('<') < 0)
		{
			text = text.substring(0, 44)
			text = text + '...'
		}
	}
	let code = `<div class="alert no" id="alert${rand}">
				<div class="gridy align:center flex">
					<div class="alert_icon" style="${photo}"></div>
					<div class="alertData">
						<div class="title fweight:bold">${title}</div>
						<div class="text">${text}</div>
					</div>
				</div>
			</div>`
	let alerts = document.querySelector('.pushAlerts')
	alerts.insertAdjacentHTML('afterbegin', code)
	push.play()

	let newAlert = document.querySelector('#alert'+rand)
	await next(1)
	newAlert.classList.remove('no')
	await next(5000)
	removeAlert(rand)
	push.pause()
}

async function loadMenu() {
	let prfl = document.querySelector('.menu.profile')
	let stgs = document.querySelector('.menu.settings')
	let t = await vk.call('users.get', { fields: 'photo_50' })
	render.build.createMenuProfile(t.photo_50)

	prfl.addEventListener('click', e => {
		Router(storage.id)
	})
	stgs.addEventListener('click', async e => {
		let sett = await import('./modules/settings.js')
		sett.realese()
	})
}

function loadStorage() {
	if('theme' in storage) {
		setTheme(storage.theme)
	}
	else
	{
		setTheme('dark')
	}
}

function setTheme(scheme) {
	storage.setItem('theme', scheme)
	document.querySelector('#color-scheme').setAttribute(`href`, `./styles/color-scheme-${scheme}.css`)
}

function copyTextToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    
  }, function(err) {
    console.error('[ERROR] ', err);
  });
}

async function checkToken() {
	let r = await vk.call('users.get')
	if(r.error) {
		storage.clear()
		render.next()
	}
}

async function removeAlert(id) {
	let alert = document.querySelector('#alert'+id)
	alert.classList.add('remove')
	await next(100)
	alert.remove()
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main()