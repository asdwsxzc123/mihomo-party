import { app, globalShortcut, ipcMain, Notification } from 'electron'
import { mainWindow, triggerMainWindow } from '..'
import {
  getAppConfig,
  getControledMihomoConfig,
  patchAppConfig,
  patchControledMihomoConfig,
} from '../config'
import { quitWithoutCore, restartCore } from '../core/manager'
import { patchMihomoConfig } from '../core/mihomoApi'
import { triggerSysProxy } from '../sys/sysproxy'

export async function registerShortcut(
  oldShortcut: string,
  newShortcut: string,
  action: string,
): Promise<boolean> {
  if (oldShortcut !== '') {
    globalShortcut.unregister(oldShortcut)
  }
  if (newShortcut === '') {
    return true
  }
  switch (action) {
    case 'showWindowShortcut': {
      return globalShortcut.register(newShortcut, () => {
        triggerMainWindow()
      })
    }
    case 'triggerSysProxyShortcut': {
      return globalShortcut.register(newShortcut, async () => {
        const {
          sysProxy: { enable },
        } = await getAppConfig()
        try {
          await triggerSysProxy(!enable)
          await patchAppConfig({ sysProxy: { enable: !enable } })
          // new Notification({
          //   title: `系统代理已${!enable ? '开启' : '关闭'}`,
          // }).show()
          mainWindow?.webContents.send('appConfigUpdated')
        } catch {
          // ignore
        } finally {
          ipcMain.emit('updateTrayMenu')
        }
      })
    }
    case 'triggerTunShortcut': {
      return globalShortcut.register(newShortcut, async () => {
        const { tun } = await getControledMihomoConfig()
        const enable = tun?.enable ?? false
        try {
          if (!enable) {
            await patchControledMihomoConfig({
              tun: { enable: !enable },
              dns: { enable: true },
            })
          } else {
            await patchControledMihomoConfig({ tun: { enable: !enable } })
          }
          await restartCore()
          new Notification({
            title: `虚拟网卡已${!enable ? '开启' : '关闭'}`,
          }).show()
          mainWindow?.webContents.send('controledMihomoConfigUpdated')
        } catch {
          // ignore
        } finally {
          ipcMain.emit('updateTrayMenu')
        }
      })
    }
    case 'ruleModeShortcut': {
      return globalShortcut.register(newShortcut, async () => {
        await patchControledMihomoConfig({ mode: 'rule' })
        await patchMihomoConfig({ mode: 'rule' })
        new Notification({
          title: '已切换至规则模式',
        }).show()
        mainWindow?.webContents.send('controledMihomoConfigUpdated')
        ipcMain.emit('updateTrayMenu')
      })
    }
    case 'globalModeShortcut': {
      return globalShortcut.register(newShortcut, async () => {
        await patchControledMihomoConfig({ mode: 'global' })
        await patchMihomoConfig({ mode: 'global' })
        new Notification({
          title: '已切换至全局模式',
        }).show()
        mainWindow?.webContents.send('controledMihomoConfigUpdated')
        ipcMain.emit('updateTrayMenu')
      })
    }
    case 'directModeShortcut': {
      return globalShortcut.register(newShortcut, async () => {
        await patchControledMihomoConfig({ mode: 'direct' })
        await patchMihomoConfig({ mode: 'direct' })
        new Notification({
          title: '已切换至直连模式',
        }).show()
        mainWindow?.webContents.send('controledMihomoConfigUpdated')
        ipcMain.emit('updateTrayMenu')
      })
    }
    case 'quitWithoutCoreShortcut': {
      return globalShortcut.register(newShortcut, async () => {
        await quitWithoutCore()
      })
    }
    case 'restartAppShortcut': {
      return globalShortcut.register(newShortcut, () => {
        app.relaunch()
        app.quit()
      })
    }
  }
  throw new Error('Unknown action')
}

export async function initShortcut(): Promise<void> {
  const {
    showWindowShortcut,
    triggerSysProxyShortcut,
    triggerTunShortcut,
    ruleModeShortcut,
    globalModeShortcut,
    directModeShortcut,
    quitWithoutCoreShortcut,
    restartAppShortcut,
  } = await getAppConfig()
  if (showWindowShortcut) {
    try {
      await registerShortcut('', showWindowShortcut, 'showWindowShortcut')
    } catch {
      // ignore
    }
  }
  if (triggerSysProxyShortcut) {
    try {
      await registerShortcut(
        '',
        triggerSysProxyShortcut,
        'triggerSysProxyShortcut',
      )
    } catch {
      // ignore
    }
  }
  if (triggerTunShortcut) {
    try {
      await registerShortcut('', triggerTunShortcut, 'triggerTunShortcut')
    } catch {
      // ignore
    }
  }
  if (ruleModeShortcut) {
    try {
      await registerShortcut('', ruleModeShortcut, 'ruleModeShortcut')
    } catch {
      // ignore
    }
  }
  if (globalModeShortcut) {
    try {
      await registerShortcut('', globalModeShortcut, 'globalModeShortcut')
    } catch {
      // ignore
    }
  }
  if (directModeShortcut) {
    try {
      await registerShortcut('', directModeShortcut, 'directModeShortcut')
    } catch {
      // ignore
    }
  }
  if (quitWithoutCoreShortcut) {
    try {
      await registerShortcut(
        '',
        quitWithoutCoreShortcut,
        'quitWithoutCoreShortcut',
      )
    } catch {
      // ignore
    }
  }
  if (restartAppShortcut) {
    try {
      await registerShortcut('', restartAppShortcut, 'restartAppShortcut')
    } catch {
      // ignore
    }
  }
}
