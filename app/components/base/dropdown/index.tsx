'use client'
import type { FC } from 'react'
import React from 'react'
import { Menu } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import classNames from 'classnames'

type DropdownItem = {
    value: string | number
    label: string
}

type DropdownProps = {
    title: string
    items: DropdownItem[]
    onSelect: (item: DropdownItem) => void
}

const Dropdown: FC<DropdownProps> = ({ title, items, onSelect }) => {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <Menu.Button className="inline-flex items-center justify-between rounded text-primary-600 bg-blue-500 text-sm px-3 py-1">
                    {title}
                    <ChevronDownIcon className="h-4 w-4" />
                </Menu.Button>
            </div>
            <Menu.Items className="absolute z-50 mt-2 w-52 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {items.map((item) => (
                    <Menu.Item key={item.value}>
                        {({ active }) => (
                            <div
                                className={classNames(
                                    'block px-4 py-2 text-sm cursor-pointer',
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                )}
                                onClick={() => onSelect(item)}
                            >
                                {item.label}
                            </div>
                        )}
                    </Menu.Item>
                ))}
            </Menu.Items>
        </Menu>
    )
}

export default React.memo(Dropdown)
