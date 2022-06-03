defmodule HTTP do

  def normalize_map(nil), do: %{}

  def normalize_map(map) when is_map(map) do
    Map.new(map, fn {key, val} ->
      {
        if(is_atom(key), do: key, else: String.to_atom(key)),
        if(is_map(val) or is_list(val), do: normalize_map(val), else: val)
      }
    end)
  end

  def normalize_map(list) when is_list(list),
    do: Enum.map(list, fn item -> normalize_map(item) end)

  def get(url) do
    case HTTPoison.get(url) do
      {:ok, %{body: body, headers: header}} ->
        {_, cookies} = Enum.find(header, fn {_, item} ->
          String.contains?(item, "sessionID")
        end)
        sessionid = Enum.at(String.split(Enum.at(String.split(cookies, ";"), 0), "="), 1)
        data =
          body
          |> Jason.decode!()
          |> normalize_map()

        {:ok, data}
          Map.put(data, :sessionID, sessionid)
      {:error, %{reason: reason}} ->
        {:error, reason}
    end
  end
end
