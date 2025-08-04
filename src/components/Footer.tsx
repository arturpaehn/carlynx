import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#4b0082] text-white mt-10">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center">
        {/* Левая часть: лого и текст */}
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <Image
            src="/logo2.png"
            alt="CarLynx Logo"
            width={120} // в 3 раза больше чем 40
            height={120}
            className="rounded"
            priority
          />
          <div>
            <h2 className="text-2xl font-bold">CarLynx</h2>
            <p className="text-sm text-gray-200">Connecting car owners across Texas.</p>
          </div>
        </div>

        {/* Правая часть: контакты */}
        <div className="text-sm text-center sm:text-right">
          <p>Contact us:</p>
          <p className="underline">support@carlynx.us</p>
        </div>
      </div>
    </footer>
  )
}
