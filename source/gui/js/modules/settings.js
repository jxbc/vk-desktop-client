let abortContr = new AbortController()

export function realese() {
	let ThemeStatus = 0
	if(storage.theme == 'white') ThemeStatus = 1

	let html = `
	<div class="settingsOption flex justify:between">
		<div class="option">
			<div class="option name">Светлая тема</div>
		</div>
		${createToggle('setTheme', ThemeStatus)}
	</div>
	<div class="settingsOption flex justify:between">
		<div class="option">
			<div class="option name">Плавные сообщения</div>
			<div class="option description">анимация</div>
		</div>
		${createToggle('setSettingsMode', SETTINGS.msg_slow_mode)}
	</div>
	<div class="settingsOption flex justify:between">
		<div class="option">
			<div class="option name">Оповещения</div>
			<div class="option description">личные чаты</div>
		</div>
		${createToggle('privatePush', 1)}
	</div>
	<div class="settingsOption flex justify:between">
		<div class="option">
			<div class="option name">Оповещения</div>
			<div class="option description">групповые чаты</div>
		</div>
		${createToggle('chatsPush', 0)}
	</div>
	<div class="settingsOption flex justify:between">
		<div class="option">
			<div class="option name">ANGLE ускоритель</div>
			<div class="option description">метод рендеринга</div>
		</div>
		<div class="listItem">Vulkan</div>
	</div>
	<div class="settingsOption flex justify:between">
		<div class="option">
			<div class="option name">Media Viewer</div>
			<div class="option description">отрисовка графики с помощью</div>
		</div>
		<div class="listItem">GPU</div>
	</div>
	<div class="settingsOption flex justify:between">
		<div class="option">
			<div class="option name">Динамическая тема</div>
			<div class="option description">в зависимости от дня/ночи</div>
		</div>
		${createToggle('dynamicTheme', 0)}
	</div>
	<div class="settingsOption flex justify:between">
		<div class="option">
			<div class="option name" style="color:#ff3a3a;">Выйти из аккаунта</div>
		</div>
	</div>
	`
	let popup = render.build.popupWindow(render.build.settings(html))
	realeseToggles()
}

function createToggle(name, status) {
	let html = `
	<div class="toggler" id="toggle_${name}" status="${status}">
			<div class="toggle"></div>
		</div>
	`
	return html
}

function getToggle(name) {
	return document.querySelector(`#toggle_${name}`)
}
function setToggle(name, status) {
	name.setAttribute('status', status)
}

function realeseToggles() {
	let theme = getToggle('setTheme')
	let settMode = getToggle('setSettingsMode')
	theme.addEventListener('click', async nxt => {
		if(storage.theme == 'dark') {
			setToggle(theme, 1)
			return setTheme('white')
		}
		if(storage.theme == 'white') {
			setToggle(theme, 0)
			return setTheme('dark')
		}
	})
	settMode.addEventListener('click', async nxt => {
		if(SETTINGS.msg_slow_mode) {
			setToggle(settMode, 0)
			return SETTINGS.msg_slow_mode = 0
		}
		if(!SETTINGS.msg_slow_mode) {
			setToggle(settMode, 1)
			return SETTINGS.msg_slow_mode = 1
		}
	})
}