export async function status () {
  const { Bill, Categories } = this.ctx

  const [cc, bc] = await Promise.all([
    Categories.count(),
    Bill.count()
  ])

  return {
    categories_length: cc,
    bill_length: bc
  }
}
