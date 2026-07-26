import type { StringInputProps } from 'sanity'

export function InstagramLink(props: StringInputProps) {
  const username = props.value

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {props.renderDefault(props)}
      {username && (
        <a
          href={`https://instagram.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 12,
            color: '#888',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
          onMouseOver={e => (e.currentTarget.style.color = '#000')}
          onMouseOut={e => (e.currentTarget.style.color = '#888')}
        >
          ↗ instagram.com/{username}
        </a>
      )}
    </div>
  )
}
