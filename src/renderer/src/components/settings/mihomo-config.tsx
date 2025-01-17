import React, { useState } from 'react'
import SettingCard from '../base/base-setting-card'
import SettingItem from '../base/base-setting-item'
import { Button, Input, Select, SelectItem, Switch } from '@nextui-org/react'
import { useAppConfig } from '@renderer/hooks/use-app-config'
import debounce from '@renderer/utils/debounce'
import {  mihomoUpgradeGeo, restartCore } from '@renderer/utils/ipc'
import { platform } from '@renderer/utils/init'
import { IoMdRefresh } from 'react-icons/io'

const MihomoConfig: React.FC = () => {
  const { appConfig, patchAppConfig } = useAppConfig()
  const [updating, setUpdating] = useState(false)
  const {
    autoCloseConnection = true,
    delayTestUrl,
    mihomoCpuPriority = 'PRIORITY_NORMAL',
    proxyCols = 'auto',
  } = appConfig || {}
  const [url, setUrl] = useState(delayTestUrl)
  const setUrlDebounce = debounce((v: string) => {
    patchAppConfig({ delayTestUrl: v })
  }, 500)
  return (
    <SettingCard>
      <SettingItem title="延迟测试地址" divider>
        <Input
          size="sm"
          className="w-[60%]"
          value={url}
          placeholder="默认 https://www.gstatic.com/generate_204"
          onValueChange={(v) => {
            setUrl(v)
            setUrlDebounce(v)
          }}></Input>
      </SettingItem>
      <SettingItem title="代理节点展示列数" divider>
        <Select
          classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
          className="w-[150px]"
          size="sm"
          selectedKeys={new Set([proxyCols])}
          onSelectionChange={async (v) => {
            await patchAppConfig({
              proxyCols: v.currentKey as 'auto' | '1' | '2' | '3' | '4',
            })
          }}>
          <SelectItem key="auto">自动</SelectItem>
          <SelectItem key="1">一列</SelectItem>
          <SelectItem key="2">两列</SelectItem>
          <SelectItem key="3">三列</SelectItem>
          <SelectItem key="4">四列</SelectItem>
        </Select>
      </SettingItem>
      {platform === 'win32' && (
        <SettingItem title="内核进程优先级" divider>
          <Select
            classNames={{ trigger: 'data-[hover=true]:bg-default-200' }}
            className="w-[150px]"
            size="sm"
            selectedKeys={new Set([mihomoCpuPriority])}
            onSelectionChange={async (v) => {
              try {
                await patchAppConfig({
                  mihomoCpuPriority: v.currentKey as Priority,
                })
                await restartCore()
              } catch (e) {
                alert(e)
              }
            }}>
            <SelectItem key="PRIORITY_HIGHEST">实时</SelectItem>
            <SelectItem key="PRIORITY_HIGH">高</SelectItem>
            <SelectItem key="PRIORITY_ABOVE_NORMAL">高于正常</SelectItem>
            <SelectItem key="PRIORITY_NORMAL">正常</SelectItem>
            <SelectItem key="PRIORITY_BELOW_NORMAL">低于正常</SelectItem>
            <SelectItem key="PRIORITY_LOW">低</SelectItem>
          </Select>
        </SettingItem>
      )}
      <SettingItem title="自动断开连接" divider>
        <Switch
          size="sm"
          isSelected={autoCloseConnection}
          onValueChange={(v) => {
            patchAppConfig({ autoCloseConnection: v })
          }}
        />
      </SettingItem>
      <SettingItem
        title="自动更新 Geo 数据库"
        actions={
          <Button
            size="sm"
            isIconOnly
            variant="light"
            onPress={async () => {
              setUpdating(true)
              try {
                await mihomoUpgradeGeo()
                new Notification('Geo 数据库更新成功')
              } catch (e) {
                alert(e)
              } finally {
                setUpdating(false)
              }
            }}>
            <IoMdRefresh
              className={`text-lg ${updating ? 'animate-spin' : ''}`}
            />
          </Button>
        }></SettingItem>
    </SettingCard>
  )
}

export default MihomoConfig
