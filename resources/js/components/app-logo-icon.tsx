interface AppLogoIconProps {
    className?: string;
}

export default function AppLogoIcon(props: AppLogoIconProps) {
    return <img src="/img/ssopt_v1.svg" alt="App Logo" {...props} />;
}
