import "dotenv/config"

import { prisma } from "../lib/prisma"

const ADMIN_PUSH_USER_KEY = "admin"

function hasArg(flag: string): boolean {
  return process.argv.includes(flag)
}

async function main() {
  const apply = hasArg("--apply")

  const adminSubscriptions = await prisma.pushSubscription.findMany({
    where: {
      userKey: {
        equals: ADMIN_PUSH_USER_KEY,
        mode: "insensitive",
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      endpoint: true,
      createdAt: true,
      userKey: true,
    },
  })

  if (adminSubscriptions.length <= 1) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          message: "Nema duplikata admin pretplata.",
          adminCount: adminSubscriptions.length,
        },
        null,
        2
      )
    )
    return
  }

  const keep = adminSubscriptions[0]
  const remove = adminSubscriptions.slice(1)

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: apply ? "apply" : "dry-run",
        keep: {
          id: keep.id,
          endpointHost: new URL(keep.endpoint).host,
          createdAt: keep.createdAt,
        },
        removeCount: remove.length,
        remove: remove.map((item) => ({
          id: item.id,
          endpointHost: new URL(item.endpoint).host,
          createdAt: item.createdAt,
        })),
      },
      null,
      2
    )
  )

  if (!apply) {
    return
  }

  const idsToDelete = remove.map((item) => item.id)
  const result = await prisma.pushSubscription.deleteMany({
    where: {
      id: {
        in: idsToDelete,
      },
    },
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        deletedCount: result.count,
      },
      null,
      2
    )
  )
}

main()
  .catch((error) => {
    console.error("keep-single-admin cleanup failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
