import { Colors } from './colors';

const baseTheme = {
  font: {
    family: 'Inter, sans-serif',
    size: {
      small: '12px',
      medium: '14px',
      large: '16px',
      xlarge: '20px',
    },
    weight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '32px',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
  },
};

export type BaseTheme = typeof baseTheme;

export interface Theme extends BaseTheme {
  colors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    border: string;
    error: string;
    success: string;
  };
  components: {
    button: {
      primary: {
        background: string;
        text: string;
        hoverBackground: string;
      };
      secondary: {
        background: string;
        text: string;
        hoverBackground: string;
      };
    };
    input: {
      background: string;
      text: string;
      border: string;
      placeholderText: string;
    };
  };
}

export const lightTheme: Theme = {
  ...baseTheme,
  colors: {
    background: Colors.neutral[0],
    text: Colors.neutral[90],
    primary: Colors.blue[60],
    secondary: Colors.blue[40],
    border: Colors.neutral[20],
    error: Colors.red[50],
    success: Colors.green[50],
  },
  components: {
    button: {
      primary: {
        background: Colors.blue[60],
        text: Colors.neutral[0],
        hoverBackground: Colors.blue[70],
      },
      secondary: {
        background: Colors.neutral[10],
        text: Colors.blue[60],
        hoverBackground: Colors.neutral[20],
      },
    },
    input: {
      background: Colors.neutral[0],
      text: Colors.neutral[90],
      border: Colors.neutral[30],
      placeholderText: Colors.neutral[50],
    },
  },
};

export const darkTheme: Theme = {
  ...baseTheme,
  colors: {
    background: Colors.neutral[90],
    text: Colors.neutral[10],
    primary: Colors.blue[40],
    secondary: Colors.blue[30],
    border: Colors.neutral[70],
    error: Colors.red[50],
    success: Colors.green[50],
  },
  components: {
    button: {
      primary: {
        background: Colors.blue[40],
        text: Colors.neutral[90],
        hoverBackground: Colors.blue[50],
      },
      secondary: {
        background: Colors.neutral[80],
        text: Colors.blue[40],
        hoverBackground: Colors.neutral[70],
      },
    },
    input: {
      background: Colors.neutral[80],
      text: Colors.neutral[10],
      border: Colors.neutral[60],
      placeholderText: Colors.neutral[40],
    },
  },
};
