"use client";

import useSWR from "swr";

export const useUser = () => {
  const { data, error } = useSWR("/api/auth/me", (url) =>
    fetch(url).then(res => res.json())
  );

  return {
    user: data?.user || null,
    isLoading: !error && !data,
    isError: !!error,
  };
};
