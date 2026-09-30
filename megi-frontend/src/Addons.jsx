import useAddons from "./hooks/useAddons";
//Ne radi nista
export default function Addons() {
  const { data: addons = [], isPending, error } = useAddons();

  if (isPending) return <p>Učitavanje</p>;
  if (error) return <p>{error.message}</p>;

  console.log(addons);
  return <></>;
}
