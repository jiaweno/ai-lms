import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageIcon } from '@heroicons/react/24/outline'
import { Dropdown } from '@/components/ui/Dropdown' // Assuming Dropdown is in ui

const languages = [
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
]

export const LanguageSwitch: React.FC = () => {
  const { i18n } = useTranslation()

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || 
                          languages.find(lang => i18n.language.startsWith(lang.code)) || // Handle cases like 'en'
                          languages[0];


  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
  }

  const dropdownItems = languages
    .filter(lang => lang.code !== currentLanguage.code) // Filter out current language
    .map(lang => ({
      label: `${lang.flag} ${lang.name}`,
      onClick: () => handleLanguageChange(lang.code),
    }))

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors focus:outline-none">
          <LanguageIcon className="h-4 w-4" />
          <span>{currentLanguage.flag} {currentLanguage.name}</span>
        </button>
      }
      items={dropdownItems}
      align="right" // Ensure dropdown aligns correctly
    />
  )
}
