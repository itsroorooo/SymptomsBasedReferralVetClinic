export default function ResponsiveGif() {
  return (
    <div className="flex flex-col items-center p-4">
      <div className="relative w-full max-w-2xl aspect-video overflow-hidden rounded-2xl">
        <img
          src="/gif/face.gif"
          alt="Dog wagging tail"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
