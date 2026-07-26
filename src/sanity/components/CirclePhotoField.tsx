import type { FieldProps } from 'sanity'

export function CirclePhotoField(props: FieldProps) {
  return (
    <div>
      <style>{`
        .circle-photo-wrap [data-testid="image-input"] > div:first-child,
        .circle-photo-wrap [class*="ImageInput"] > div:first-child {
          max-width: 120px !important;
          max-height: 120px !important;
        }
        .circle-photo-wrap [data-testid="image-preview"],
        .circle-photo-wrap img {
          border-radius: 4px !important;
          object-fit: cover !important;
          aspect-ratio: 1 / 1 !important;
        }
      `}</style>
      <div className="circle-photo-wrap" style={{ maxWidth: 120 }}>
        {props.renderDefault(props)}
      </div>
    </div>
  )
}
