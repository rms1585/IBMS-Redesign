const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ibms', {
  platform: process.platform,
  isDesktop: true,
});
