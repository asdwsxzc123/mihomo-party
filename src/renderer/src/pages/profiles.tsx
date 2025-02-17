import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from '@nextui-org/react'
import BasePage from '@renderer/components/base/base-page'
import ProfileItem from '@renderer/components/profiles/profile-item'
import { useProfileConfig } from '@renderer/hooks/use-profile-config'
import {
  getFilePath,
  readTextFile
} from '@renderer/utils/ipc'
import type { KeyboardEvent } from 'react'
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { FaPlus } from 'react-icons/fa6'
import { IoMdRefresh } from 'react-icons/io'
import { MdContentPaste } from 'react-icons/md'

const Profiles: React.FC = () => {
  const {
    profileConfig,
    setProfileConfig,
    addProfileItem,
    updateProfileItem,
    removeProfileItem,
    changeCurrentProfile,
    mutateProfileConfig,
  } = useProfileConfig()
  const { current, items = [] } = profileConfig || {}
  const [sortedItems, setSortedItems] = useState(items)
  const [useProxy, setUseProxy] = useState(false)
  const [importing, setImporting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [fileOver, setFileOver] = useState(false)
  const [url, setUrl] = useState('')
  const isUrlEmpty = url.trim() === ''
  const sensors = useSensors(useSensor(PointerSensor))
  const handleImport = async (): Promise<void> => {
    setImporting(true)
    await addProfileItem({ name: '', type: 'remote', url, useProxy })
    setUrl('')
    setImporting(false)
  }
  const pageRef = useRef<HTMLDivElement>(null)

  const onDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event
    if (over) {
      if (active.id !== over.id) {
        const newOrder = sortedItems.slice()
        const activeIndex = newOrder.findIndex((item) => item.id === active.id)
        const overIndex = newOrder.findIndex((item) => item.id === over.id)
        newOrder.splice(activeIndex, 1)
        newOrder.splice(overIndex, 0, items[activeIndex])
        setSortedItems(newOrder)
        await setProfileConfig({ current, items: newOrder })
      }
    }
  }

  const handleInputKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || isUrlEmpty) return
      handleImport()
    },
    [isUrlEmpty],
  )

  useEffect(() => {
    pageRef.current?.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
      setFileOver(true)
    })
    pageRef.current?.addEventListener('dragleave', (e) => {
      e.preventDefault()
      e.stopPropagation()
      setFileOver(false)
    })
    pageRef.current?.addEventListener('drop', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (event.dataTransfer?.files) {
        const file = event.dataTransfer.files[0]
        if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
          try {
            const path = window.api.webUtils.getPathForFile(file)
            const content = await readTextFile(path)
            await addProfileItem({
              name: file.name,
              type: 'local',
              file: content,
            })
          } catch (e) {
            alert(e)
          }
        } else {
          alert('不支持的文件类型')
        }
      }
      setFileOver(false)
    })
    return (): void => {
      pageRef.current?.removeEventListener('dragover', () => {})
      pageRef.current?.removeEventListener('dragleave', () => {})
      pageRef.current?.removeEventListener('drop', () => {})
    }
  }, [])

  useEffect(() => {
    setSortedItems(items)
  }, [items])

  return (
    <BasePage
      ref={pageRef}
      title="订阅管理"
      header={
        <Button
          size="sm"
          title="更新全部订阅"
          className="app-nodrag"
          variant="light"
          isIconOnly
          onPress={async () => {
            setUpdating(true)
            for (const item of items) {
              if (item.id === current) continue
              if (item.type !== 'remote') continue
              await addProfileItem(item)
            }
            const currentItem = items.find((item) => item.id === current)
            if (currentItem && currentItem.type === 'remote') {
              await addProfileItem(currentItem)
            }
            setUpdating(false)
          }}>
          <IoMdRefresh
            className={`text-lg ${updating ? 'animate-spin' : ''}`}
          />
        </Button>
      }>
      <div className="sticky profiles-sticky top-0 z-40 bg-background">
        <div className="flex p-2">
          <Input
            size="sm"
            value={url}
            onValueChange={setUrl}
            onKeyUp={handleInputKeyUp}
            endContent={
              <>
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  onPress={() => {
                    navigator.clipboard.readText().then((text) => {
                      setUrl(text)
                    })
                  }}>
                  <MdContentPaste className="text-lg" />
                </Button>
                <Checkbox
                  className="whitespace-nowrap"
                  checked={useProxy}
                  onValueChange={setUseProxy}>
                  代理
                </Checkbox>
              </>
            }
          />

          <Button
            size="sm"
            color="primary"
            className="ml-2"
            isDisabled={isUrlEmpty}
            isLoading={importing}
            onPress={handleImport}>
            导入
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button
                className="ml-2 new-profile"
                size="sm"
                isIconOnly
                color="primary">
                <FaPlus />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={async (key) => {
                if (key === 'open') {
                  try {
                    const files = await getFilePath(['yml', 'yaml'])
                    if (files?.length) {
                      const content = await readTextFile(files[0])
                      const fileName = files[0]
                        .split('/')
                        .pop()
                        ?.split('\\')
                        .pop()
                      await addProfileItem({
                        name: fileName,
                        type: 'local',
                        file: content,
                      })
                    }
                  } catch (e) {
                    alert(e)
                  }
                } else if (key === 'new') {
                  await addProfileItem({
                    name: '新建订阅',
                    type: 'local',
                    file: 'proxies: []\nproxy-groups: []\nrules: []',
                  })
                }
              }}>
              <DropdownItem key="open">打开</DropdownItem>
              <DropdownItem key="new">新建</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
        <Divider />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}>
        <div
          className={`${fileOver ? 'blur-sm' : ''} grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 m-2`}>
          <SortableContext
            items={sortedItems.map((item) => {
              return item.id
            })}>
            {sortedItems.map((item) => (
              <ProfileItem
                key={item.id}
                isCurrent={item.id === current}
                addProfileItem={addProfileItem}
                removeProfileItem={removeProfileItem}
                mutateProfileConfig={mutateProfileConfig}
                updateProfileItem={updateProfileItem}
                info={item}
                onClick={async () => {
                  await changeCurrentProfile(item.id)
                }}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </BasePage>
  )
}

export default Profiles
