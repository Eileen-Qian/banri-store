export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="container py-5 text-center">
      <h1>訂單成功</h1>
      <p className="text-muted">訂單 ID: {id}</p>
      <p className="text-muted">建置中</p>
    </div>
  );
}
