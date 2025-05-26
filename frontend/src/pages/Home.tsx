import { ArrowRightIcon, SparklesIcon, BookOpenIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export const Home = () => {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              AI驱动，个性化学习体验尽在掌控.{' '}
              <a href="#" className="font-semibold text-primary-600">
                <span className="absolute inset-0" aria-hidden="true" />
                了解更多 <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              智能学习，开启无限可能
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              通过AI个性化推荐、智能测评、高效资源管理，助您轻松掌握知识，成就卓越。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                立即开始学习
              </a>
              <a href="#" className="text-sm font-semibold leading-6 text-gray-900">
                了解更多 <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">功能强大</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            专为您的学习之旅设计
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            我们的AI学习管理系统提供一系列强大功能，助您高效学习，轻松掌握知识。
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <SparklesIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                个性化AI推荐
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                根据您的学习进度和偏好，AI智能推荐最适合您的学习路径和资源。
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <BookOpenIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                高效资源管理
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                轻松上传、组织和查找各类学习资料，打造您的专属知识库。
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                智能学习评估
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                通过AI驱动的测验和考试，精准评估您的学习效果，发现薄弱环节。
              </dd>
            </div>
            <div className="relative pl-16">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                  <ArrowRightIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                多终端无缝衔接
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600">
                支持桌面、平板、手机多终端同步，随时随地开启学习模式。
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
