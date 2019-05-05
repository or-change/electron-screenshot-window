import { ipcRenderer } from 'electron';
import { Resizable } from '../../../../webVdesk/ui-native';
import './style.css';

ipcRenderer.on('ELECTRON_SCREENSHOT_WINDOW::get-background-result', (event, d) => {
	body.style.backgroundImage = `url(${d})`;
});

ipcRenderer.send('ELECTRON_SCREENSHOT_WINDOW::get-background');

function draw(canvas, rect) {
	const context = canvas.getContext('2d');

	context.fillStyle = 'rgba(0, 0, 0, 0.5)';
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.fillRect(0, 0, canvas.width, canvas.height);

	if (rect) {
		const { x, y, width, height } = rect;
		context.clearRect(x, y, width, height);
	}
}

let selecting = false;
let area = null;

const { body } = document;
const { height, width } = body.getBoundingClientRect();

const canvas = document.createElement('canvas');
canvas.height = height;
canvas.width = width;
body.appendChild(canvas);
draw(canvas);


function reset() {
	selecting = false;
	area.remove();
	area = null;
	draw(canvas);
}

function onMousedown(event) {
	if (event.button === 2 && event.ctrlKey) {
		ipcRenderer.send('ELECTRON_SCREENSHOT_WINDOW::exit');
		return;
	}

	if (event.button !== 0) {
		return;
	}

	if (selecting) {
		return;
	}


	selecting = true;

	area = document.createElement('div');
	area.id = 'area';
	new Resizable(area);
	const start = {
		x: event.screenX,
		y: event.screenY
	};

	area.style.left = start.x + 'px';
	area.style.top = start.y + 'px';
	body.appendChild(area);

	function onVdResize(event) {
		draw(canvas, event.target.getBoundingClientRect());
	}

	function onMousemove(event) {
		const { clientX: x, clientY: y } = event;
		if (x > start.x) {
			area.style.left = start.x + 'px';
			area.style.width = x - start.x + 'px';
		} else {
			area.style.left = x + 'px';
			area.style.width = start.x - x + 'px';
		}

		if (y > start.y) {
			area.style.top = start.y + 'px';
			area.style.height = y - start.y + 'px';
		} else {
			area.style.top = y + 'px';
			area.style.height = start.y - y + 'px';
		}

		draw(canvas, area.getBoundingClientRect());
	}

	function onKeydown(event) {
		if (event.code === 'Escape') {
			reset();
			document.removeEventListener('keydown', onKeydown);
		}

		if (event.code === 'Enter') {
			const { x, y, width, height } = area.getBoundingClientRect();
			ipcRenderer.send('ELECTRON_SCREENSHOT_WINDOW::rect-result', { x, y, width, height });

			area.remove();
			document.removeEventListener('keydown', onKeydown);
		}
	}

	function onMouseup(event) {
		document.removeEventListener('mousemove', onMousemove);
		document.removeEventListener('mouseup', onMouseup);
		document.addEventListener('keydown', onKeydown);

		area.addEventListener('vd-resize', onVdResize);
	}

	document.addEventListener('mousemove', onMousemove);
	document.addEventListener('mouseup', onMouseup);
}

document.addEventListener('mousedown', onMousedown);