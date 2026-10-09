import PageHeader from "@/components/admin/PageHeader";
import NewClientForm from "./NewClientForm";

export default function NewAgencyClientPage() {
  return (
    <div className="flex flex-col gap-sp-5">
      <PageHeader eyebrow="Agencia" title="Nueva creadora" description="Crea su cuenta, ya en plan Crew, con su propio sitio y su código de acceso." />
      <NewClientForm />
    </div>
  );
}
