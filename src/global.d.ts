/* Global module declarations to satisfy TS/JSX imports for local UI components.
   These components are implemented in plain JS; declare them with any props so the
   TypeScript checker (used by the IDE) won't raise prop type errors for JSX usage.
*/

declare module '@/components/ui/button' {
    import React from 'react';
    export const Button: React.FC<any>;
    export default Button;
}

declare module '@/components/ui/label' {
    import React from 'react';
    const Label: React.FC<any>;
    export { Label };
    export default Label;
}

declare module '@/components/ui/input' {
    import React from 'react';
    const Input: React.FC<any>;
    export { Input };
    export default Input;
}

declare module '@/components/ui/select' {
    import React from 'react';
    export const Select: React.FC<any>;
    export const SelectTrigger: React.FC<any>;
    export const SelectContent: React.FC<any>;
    export const SelectItem: React.FC<any>;
    export const SelectValue: React.FC<any>;
}

declare module '@/components/ui/tabs' {
    import React from 'react';
    export const Tabs: React.FC<any>;
    export const TabsList: React.FC<any>;
    export const TabsTrigger: React.FC<any>;
    export const TabsContent: React.FC<any>;
}

declare module '@/components/ui/skeleton' {
    import React from 'react';
    const Skeleton: React.FC<any>;
    export default Skeleton;
}

// Fallback for any other ui subpaths
declare module '@/components/ui/*' {
    import React from 'react';
    const Component: React.FC<any>;
    export default Component;
}

interface ImportMetaEnv { [key: string]: any }
interface ImportMeta { env: ImportMetaEnv }
