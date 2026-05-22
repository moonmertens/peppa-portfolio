export default function Loading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-cream)',
      }}
    >
      <div
        className="animate-pulse w-48 h-2 rounded"
        style={{ backgroundColor: 'var(--color-muted)' }}
      />
    </div>
  )
}
