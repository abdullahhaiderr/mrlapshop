import { saveCustomerAddressAction } from "@/app/account/actions";

type Address = {
  id: string; label: string; recipient_name: string; phone: string; city: string;
  address_line: string; postal_code: string | null; is_default: boolean;
};

export function AddressForm({ address }: { address?: Address }) {
  return (
    <form action={saveCustomerAddressAction} className="address-form-v17">
      <input type="hidden" name="id" value={address?.id ?? ""}/>
      <label>Address label<input name="label" required minLength={2} maxLength={40} defaultValue={address?.label ?? "Home"} placeholder="Home, Office…"/></label>
      <label>Recipient name<input name="recipientName" required minLength={2} maxLength={120} autoComplete="name" defaultValue={address?.recipient_name ?? ""}/></label>
      <label>Phone number<input name="phone" required minLength={7} maxLength={30} autoComplete="tel" defaultValue={address?.phone ?? ""}/></label>
      <label>City<input name="city" required minLength={2} maxLength={100} autoComplete="address-level2" defaultValue={address?.city ?? ""}/></label>
      <label>Complete address<textarea name="addressLine" required minLength={5} maxLength={500} rows={3} autoComplete="street-address" defaultValue={address?.address_line ?? ""}/></label>
      <label>Postal code<input name="postalCode" maxLength={20} autoComplete="postal-code" defaultValue={address?.postal_code ?? ""}/></label>
      <label className="address-default-check"><input name="isDefault" type="checkbox" defaultChecked={address?.is_default ?? false}/> Set as my default address</label>
      <button className="button button-primary" type="submit">{address ? "Save address" : "Add address"}</button>
    </form>
  );
}
