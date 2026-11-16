const Tips = ({ tips }: { tips: string[] }) => (
  <div className="tips">
    {tips.map((tip) => (
      <span key={tip}>{tip}</span>
    ))}
  </div>
)

export default Tips
