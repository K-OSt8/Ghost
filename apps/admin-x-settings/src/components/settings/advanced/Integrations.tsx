import IntegrationsSettingsImg from '../../../assets/images/integrations-settings.png';
import NiceModal from '@ebay/nice-modal-react';
import React, {useState} from 'react';
import TopLevelGroup from '../../TopLevelGroup';
import usePinturaEditor from '../../../hooks/usePinturaEditor';
import {Button, ConfirmationModal, Icon, List, ListItem, NoValueLabel, SettingGroupHeader, TabView, showToast, withErrorBoundary} from '@tryghost/admin-x-design-system';
import {ReactComponent as FirstPromoterIcon} from '../../../assets/icons/firstpromoter.svg';
import {Integration, useBrowseIntegrations, useDeleteIntegration} from '@tryghost/admin-x-framework/api/integrations';
import {ReactComponent as PinturaIcon} from '../../../assets/icons/pintura.svg';
import {ReactComponent as SlackIcon} from '../../../assets/icons/slack.svg';
import {ReactComponent as UnsplashIcon} from '../../../assets/icons/unsplash.svg';
import {ReactComponent as ZapierIcon} from '../../../assets/icons/zapier.svg';
import {getSettingValues} from '@tryghost/admin-x-framework/api/settings';
import {useGlobalData} from '../../providers/GlobalDataProvider';
import {useHandleError} from '@tryghost/admin-x-framework/hooks';
import {useRouting} from '@tryghost/admin-x-framework/routing';

interface IntegrationItemProps {
    icon?: React.ReactNode,
    title: string,
    detail: string | React.ReactNode,
    action: () => void;
    onDelete?: () => void;
    active?: boolean;
    disabled?: boolean;
    testId?: string;
    custom?: boolean;
}

const IntegrationItem: React.FC<IntegrationItemProps> = ({
    icon,
    title,
    detail,
    action,
    onDelete,
    active,
    disabled,
    testId,
    custom = false
}) => {
    const {updateRoute} = useRouting();

    const handleClick = (e?: React.MouseEvent<HTMLElement>) => {
        // Prevent the click event from bubbling up when clicking the delete button
        e?.stopPropagation();

        if (disabled) {
            updateRoute({route: 'pro', isExternal: true});
        } else {
            action();
        }
    };

    const handleDelete = (e?: React.MouseEvent<HTMLElement>) => {
        e?.stopPropagation();
        onDelete?.();
    };

    const buttons = custom ?
        <Button color='red' label='Delete' link onClick={handleDelete} />
        :
        (disabled ?
            <Button icon='lock-locked' label='Upgrade' link onClick={handleClick} /> :
            <Button color='green' label='Configure' link onClick={handleClick} />
        );

    return <ListItem
        action={buttons}
        avatar={icon}
        className={disabled ? 'opacity-50 saturate-0' : ''}
        detail={detail}
        hideActions={!disabled}
        testId={testId}
        title={active ? <span className='inline-flex items-center gap-1'>{title} <span className='inline-flex items-center rounded-full bg-[rgba(48,207,67,0.15)] px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-green'>Active</span></span> : title}
        onClick={handleClick}
    />;
};

const BuiltInIntegrations: React.FC = () => {
    const {config} = useGlobalData();
    const {updateRoute} = useRouting();

    const openModal = (modal: string) => {
        updateRoute(modal);
    };

    const zapierDisabled = config.hostSettings?.limits?.customIntegrations?.disabled;

    const pinturaEditor = usePinturaEditor();

    const {settings} = useGlobalData();
    const [unsplashEnabled, firstPromoterEnabled, slackUrl, slackUsername] = getSettingValues<boolean>(settings, [
        'unsplash',
        'firstpromoter',
        'slack_url',
        'slack_username'
    ]);

    return (
        <List titleSeparator={false}>
            <IntegrationItem
                action={() => {
                    openModal('integrations/zapier');
                }}
                detail='Automation for your apps'
                disabled={zapierDisabled}
                icon={<ZapierIcon className='h-8 w-8' />}
                testId='zapier-integration'
                title='Zapier' />

            <IntegrationItem
                action={() => {
                    openModal('integrations/slack');
                }}
                active={slackUrl && slackUsername}
                detail='A messaging app for teams'
                icon={<SlackIcon className='h-8 w-8' />}
                testId='slack-integration'
                title='Slack' />

            <IntegrationItem
                action={() => {
                    openModal('integrations/unsplash');
                }}
                active={unsplashEnabled}
                detail='Beautiful, free photos'
                icon={<UnsplashIcon className='h-8 w-8' />}
                testId='unsplash-integration'
                title='Unsplash' />

            <IntegrationItem
                action={() => {
                    openModal('integrations/firstpromoter');
                }}
                active={firstPromoterEnabled}
                detail='Launch your member referral program'
                icon={<FirstPromoterIcon className='h-8 w-8' />}
                testId='firstpromoter-integration'
                title='FirstPromoter' />

            <IntegrationItem
                action={() => {
                    openModal('integrations/pintura');
                }}
                active={pinturaEditor.isEnabled}
                detail='Advanced image editing'
                icon={<PinturaIcon className='h-8 w-8' />}
                testId='pintura-integration'
                title='Pintura' />
        </List>
    );
};

const CustomIntegrations: React.FC<{integrations: Integration[]}> = ({integrations}) => {
    const {updateRoute} = useRouting();
    const {mutateAsync: deleteIntegration} = useDeleteIntegration();
    const handleError = useHandleError();

    if (integrations.length) {
        return (
            <List borderTop={false}>
                {integrations.map(integration => (
                    <IntegrationItem
                        action={() => updateRoute({route: `integrations/${integration.id}`})}
                        detail={<div className="line-clamp-2 break-words">
                            <span title={`${integration.name}: ${integration.description || 'No description'}`}>{integration.description || 'No description'}</span>
                        </div>}
                        icon={
                            integration.icon_image ?
                                <img className='h-8 w-8 shrink-0 object-cover' role='presentation' src={integration.icon_image} /> :
                                <Icon className='w-8 shrink-0' name='integration' />
                        }
                        title={integration.name}
                        custom
                        onDelete={() => {
                            NiceModal.show(ConfirmationModal, {
                                title: 'Are you sure?',
                                prompt: 'Deleting this integration will remove all webhooks and api keys associated with it.',
                                okColor: 'red',
                                okLabel: 'Delete Integration',
                                onOk: async (confirmModal) => {
                                    try {
                                        await deleteIntegration(integration.id);
                                        confirmModal?.remove();
                                        showToast({
                                            title: 'Integration deleted',
                                            type: 'info',
                                            options: {
                                                position: 'bottom-left'
                                            }
                                        });
                                    } catch (e) {
                                        handleError(e);
                                    }
                                }
                            });
                        }}
                    />)
                )}
            </List>
        );
    } else {
        return <NoValueLabel icon='integration'>
        No custom integration.
        </NoValueLabel>;
    }
};

const Integrations: React.FC<{ keywords: string[] }> = ({keywords}) => {
    const [selectedTab, setSelectedTab] = useState<'built-in' | 'custom'>('built-in');
    const {data: {integrations} = {integrations: []}} = useBrowseIntegrations();
    const {updateRoute} = useRouting();

    const tabs = [
        {
            id: 'built-in',
            title: 'Built-in',
            contents: <BuiltInIntegrations />
        },
        {
            id: 'custom',
            title: 'Custom',
            contents: <CustomIntegrations integrations={integrations.filter(integration => integration.type === 'custom')} />
        }
    ] as const;

    const buttons = (
        <Button
            className='mt-[-5px] inline-flex h-7 cursor-pointer items-center justify-center whitespace-nowrap rounded px-3 text-sm font-semibold text-grey-900 transition hover:bg-grey-200 dark:text-white dark:hover:bg-grey-900 [&:hover]:text-black'
            color='clear'
            label='Add custom integration'
            link
            onClick={() => {
                updateRoute('integrations/new');
                setSelectedTab('custom');
            }}
        />
    );

    return (
        <TopLevelGroup
            customButtons={buttons}
            customHeader={
                <div className='sm:-mt-5 md:-mt-7'>
                    <div className='-mx-5 overflow-hidden rounded-t-xl border-b border-grey-200 md:-mx-7 dark:border-grey-800'>
                        <img className='h-full w-full' src={IntegrationsSettingsImg} />
                    </div>
                    <div className=' z-10 mt-6 flex items-start justify-between'>
                        <SettingGroupHeader description='Make Ghost work with apps and tools.' title='Integrations' />
                        {
                            <Button className='mt-[-5px] inline-flex h-7 cursor-pointer items-center justify-center whitespace-nowrap rounded px-3 text-sm font-semibold text-grey-900 transition hover:bg-grey-200 dark:text-white dark:hover:bg-grey-900 [&:hover]:text-black' color='clear' label='Add custom integration' link onClick={() => {
                                updateRoute('integrations/new');
                                setSelectedTab('custom');
                            }} />
                        }
                    </div>
                </div>
            }
            keywords={keywords}
            navid='integrations'
            testId='integrations'
        >
            <TabView<'built-in' | 'custom'> selectedTab={selectedTab} tabs={tabs} onTabChange={setSelectedTab} />
        </TopLevelGroup>
    );
};

export default withErrorBoundary(Integrations, 'Integrations');
