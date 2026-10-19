import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../data/api";

// Prefiksi: invalidacija pogađa i konobarsku (samo dostupno) i admin (sve) listu.
export const FOOD_KEY = ["food"];
export const ADDONS_KEY = ["menu", "addons"];
export const DRINKS_KEY = ["menu", "drink"];

/**
 * Mutacija + osvježavanje liste nakon uspjeha.
 * refetchType "all": liste imaju refetchOnMount: false, pa bi se neaktivni
 * query (npr. konobarski meni dok je otvoren Admin) inače nikad ne osvježio.
 */
function useMenuMutation(mutationFn, queryKey) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey, refetchType: "all" }),
  });
}

// ---- jela ----
export const useCreateFood = () => useMenuMutation(api.createFood, FOOD_KEY);
export const useUpdateFood = () =>
  useMenuMutation(({ id, ...body }) => api.updateFood(id, body), FOOD_KEY);
export const useSetFoodAvailable = () =>
  useMenuMutation(
    ({ id, available }) => api.setFoodAvailable(id, available),
    FOOD_KEY,
  );
export const useDeleteFood = () => useMenuMutation(api.deleteFood, FOOD_KEY);

// ---- porcije ----
export const useAddPortion = () =>
  useMenuMutation(({ foodId, ...body }) => api.addPortion(foodId, body), FOOD_KEY);
export const useUpdatePortion = () =>
  useMenuMutation(({ id, ...body }) => api.updatePortion(id, body), FOOD_KEY);
export const useDeletePortion = () =>
  useMenuMutation(api.deletePortion, FOOD_KEY);

// ---- opcije ----
export const useAddOption = () =>
  useMenuMutation(({ foodId, ...body }) => api.addOption(foodId, body), FOOD_KEY);
export const useUpdateOption = () =>
  useMenuMutation(({ id, ...body }) => api.updateOption(id, body), FOOD_KEY);
export const useDeleteOption = () =>
  useMenuMutation(api.deleteOption, FOOD_KEY);

// ---- prilozi ----
export const useCreateAddon = () => useMenuMutation(api.createAddon, ADDONS_KEY);
export const useUpdateAddon = () =>
  useMenuMutation(({ id, ...body }) => api.updateAddon(id, body), ADDONS_KEY);
export const useSetAddonAvailable = () =>
  useMenuMutation(
    ({ id, available }) => api.setAddonAvailable(id, available),
    ADDONS_KEY,
  );
export const useDeleteAddon = () => useMenuMutation(api.deleteAddon, ADDONS_KEY);

// ---- piće ----
export const useCreateDrink = () => useMenuMutation(api.createDrink, DRINKS_KEY);
export const useUpdateDrink = () =>
  useMenuMutation(({ id, ...body }) => api.updateDrink(id, body), DRINKS_KEY);
export const useSetDrinkAvailable = () =>
  useMenuMutation(
    ({ id, available }) => api.setDrinkAvailable(id, available),
    DRINKS_KEY,
  );
export const useDeleteDrink = () => useMenuMutation(api.deleteDrink, DRINKS_KEY);
