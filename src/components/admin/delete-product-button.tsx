"use client";

import { deleteProductAction } from "@/app/admin/(dashboard)/actions";

export function DeleteProductButton({ productId, productTitle }: { productId: string; productTitle: string }) {
  return <form action={deleteProductAction} onSubmit={(event) => {
    const approved = window.confirm("Permanently delete “" + productTitle + "”? Product photos will be removed. Existing order history will be preserved.");
    if (!approved) event.preventDefault();
  }}>
    <input type="hidden" name="productId" value={productId}/>
    <button className="button button-danger" type="submit">Delete product permanently</button>
  </form>;
}
