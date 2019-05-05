const path = require('path');
const { format: formatUrl } = require('url');
const { BrowserWindow, ipcMain } = require('electron');

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
	
		const url = formatUrl({
			pathname: path.resolve(__dirname, '../renderer', 'index.html'),
			protocol: 'file',
			slashes: true
		});

		// const url = `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`;

		win.loadURL(url);
		win.setBounds({ x: 0, y: 0 });

		ipcMain.on('ELECTRON_SCREENSHOT_WINDOW::get-background', () => {
			win.webContents.send('ELECTRON_SCREENSHOT_WINDOW::get-background-result', dataURL);
		});
		ipcMain.once('ELECTRON_SCREENSHOT_WINDOW::exit', () => win.close());
	
		ipcMain.on('ELECTRON_SCREENSHOT_WINDOW::rect-result', (event, args) => win.destroy() & resolve(args));
	});
};