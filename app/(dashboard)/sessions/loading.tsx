export default function SessionsLoading() {
  return (
    <div className="flex flex-col space-y-6 max-w-[1400px] mx-auto">
      <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
      <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}
