declare module '@strapi/strapi/admin' {
  export function useField(name: string): {
    value: unknown;
    error?: string;
    onChange(name: string, value: unknown): void;
  };

  export function useFetchClient(): {
    get<T = unknown>(url: string): Promise<{ data: T }>;
    post<T = unknown>(url: string, data?: unknown): Promise<{ data: T }>;
  };

  export function ConfirmDialog(props: {
    children?: import('react').ReactNode;
    onConfirm?: () => Promise<void> | void;
    onCancel?: () => Promise<void> | void;
    title?: import('react').ReactNode;
    variant?: string;
  }): import('react').ReactElement;
}
