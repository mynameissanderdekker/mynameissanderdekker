'use client'
import type { ObjectInputProps } from 'sanity'

export function CompactDimensions(props: ObjectInputProps) {
  const members = props.members as any[]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
      {members.map((member: any) => (
        <div key={member.key}>
          {props.renderDefault({
            ...props,
            members: [member],
          })}
        </div>
      ))}
    </div>
  )
}
