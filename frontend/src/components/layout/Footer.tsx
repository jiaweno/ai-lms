export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="flex justify-center space-x-6 md:order-2">
          {/* Social media icons could go here */}
          {/* Example: <a href="#" className="text-gray-400 hover:text-gray-500"><span className="sr-only">Facebook</span><FacebookIcon className="h-6 w-6" aria-hidden="true" /></a> */}
        </div>
        <div className="mt-8 md:order-1 md:mt-0">
          <p className="text-center text-xs leading-5 text-gray-500">
            &copy; 2024 AI学习管理系统. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  )
}
