import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import prisma from "app/db.server";
import { cors } from "remix-utils/cors";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop");

  if (!customerId || !productId || !shop) {
    return cors(request, json({ ok: false, message: "Missing required fields" }));
  }

  const record = await prisma.wishlist.findFirst({
    where: { customerId, productId, shop },
  });

  return cors(request, json({ ok: true, exists: Boolean(record) }));
}

export async function action({ request }: ActionFunctionArgs) {
  const method = request.method;
  
  const formData = await request.formData();
  const customerId = formData.get("customerId") as string;
  const productId = formData.get("productId") as string;
  const shop = formData.get("shop") as string;
  const _action = formData.get("_action") as string;

  if (!customerId || !productId || !shop || !_action) {
    return cors(request, json({ ok: false, message: "Missing required fields" }));
  }

  switch (method) {
    case "POST":  
      if (_action === "add") {
        const wishlist = await prisma.wishlist.create({
          data: { customerId, productId, shop },
        });
        return cors(request, json({ ok: true, message: "Wishlist item added successfully", data: wishlist }));
      } else if (_action === "remove") {
        const record = await prisma.wishlist.findFirst({
          where: { customerId, productId, shop },
        });
        if (!record) {
          return cors(request, json({ ok: false, message: "Wishlist item not found" }));
        }
        const wishlist = await prisma.wishlist.delete({
          where: { id: record.id },
        });
        return cors(request, json({ ok: true, message: "Wishlist item removed successfully", data: wishlist }));
      }
      default:
        return cors(request, json({ ok: false, message: "Method not supported" }));
    }
  }
