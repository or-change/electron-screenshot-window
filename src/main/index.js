const path = require('path');
const { format: formatUrl } = require('url');
const { BrowserWindow, ipcMain } = require('electron');

const url = formatUrl({
	pathname: path.resolve(__dirname, '../renderer', 'index.html'),
	protocol: 'file',
	slashes: true
});

// const url = `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`;


module.exports = async function getRect(dataURL, size) {
	return new Promise(resolve => {
		const win = new BrowserWindow({
			useContentSize: true,
			minWidth: size.width,
			minHeight: size.height,
			frame: false,
			movable: false,
			alwaysOnTop: true,
			webPreferences: {
				nodeIntegration: true,
				webSecurity: false
			}
		});
		
		win.setBounds({ x: 0, y: 0 });

		function destroy() {
			win.destroy();
			removeAllListener();
		}

		function removeAllListener() {
			eventListenerList.forEach(([eventType, listener]) => ipcMain.removeListener(eventType, listener));
		}

		function addAllListener() {
			eventListenerList.forEach(([eventType, listener]) => ipcMain.on(eventType, listener));
		}
		
		const onGetBackground = () => win.webContents.send('ELECTRON_SCREENSHOT_WINDOW::get-background-result', dataURL);
		const onExit = () => destroy();
		const onRectResult = (event, args) => destroy() & resolve(args);

		const eventListenerList = [
			['ELECTRON_SCREENSHOT_WINDOW::get-background', onGetBackground],
			['ELECTRON_SCREENSHOT_WINDOW::exit', onExit],
			['ELECTRON_SCREENSHOT_WINDOW::rect-result', onRectResult]
		];
		
		addAllListener();

		win.loadURL(url);
	});
};