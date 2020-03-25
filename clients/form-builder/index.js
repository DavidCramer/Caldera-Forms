import {
    ConditionalEditor,
    SubscribesToFormFields,
    translationStrings,
    conditionalsFromCfConfig,
    Processors
} from '@calderajs/form-builder';
import React from 'react';
import {render} from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import {RenderComponentViaPortal} from "../render/components/RenderComponentViaPortal";
import ErrorBoundary from 'react-error-boundary';

/**
 * Called when errors inside error boundaries are caught
 */
const errorHandler = (error, componentStack) => {
    console.log(error);
    console.log(componentStack);
};

/**
 * The Caldera Forms form builder app for building forms.
 *
 * Currently manages both conditional logic editors.
 */
const FormBuilder = ({conditionalsNode, initialConditionals, form}) => {
    //The id of the currently active processor
    const [activeProcessorId, setActiveProcessorId] = React.useState('');
    //Element processor conditional logic UI is rendered on.
    const processorConditionalsNode = React.useRef();

    //Listen outside of app for changes to active conditional
    React.useEffect(() => {
        window.jQuery(document).on('click', '.caldera-editor-processor-config-wrapper .set-conditions', function () {
            const pId = jQuery(this).data('pid');
            processorConditionalsNode.current = document.getElementById(`${pId}_conditions_pane`);
            setActiveProcessorId(pId);
        });
        window.jQuery(document).on('click', '.caldera-processor-nav', function () {
            const pId = jQuery(this).data('pid');
            processorConditionalsNode.current = document.getElementById(`${pId}_conditions_pane`);
            setActiveProcessorId(pId);
        });

    }, [setActiveProcessorId]);


    let savedProcessors = form.hasOwnProperty('processors') ? form.processors : {};
    //Important: As long as some of the builder is not in React, we will ONLY render via portal here.
    //Memoize so it will re-render when active processor changes
    return React.useMemo(() => (
        <SubscribesToFormFields
            jQuery={window.jQuery}
            intitalFields={form.fields}
            component={({formFields}) => {
                return (
                    <React.Fragment>
                        {/** Processor Conditional Logic Editor*/}
                        {processorConditionalsNode.current && (
                            <RenderComponentViaPortal
                                domNode={processorConditionalsNode.current}
                            >
                                <ErrorBoundary onError={errorHandler}>
                                    <Processors
                                        savedProcessors={savedProcessors}
                                        strings={translationStrings}
                                        formFields={formFields}
                                        activeProcessorId={activeProcessorId}
                                    />
                                </ErrorBoundary>
                            </RenderComponentViaPortal>
                        )}
                        {/** Primary Conditional Logic Editor*/}
                        <RenderComponentViaPortal
                            domNode={conditionalsNode}
                        >
                            <ErrorBoundary onError={errorHandler}>
                                <ConditionalEditor
                                    formFields={formFields}
                                    strings={translationStrings}
                                    conditionals={initialConditionals}
                                />
                            </ErrorBoundary>
                        </RenderComponentViaPortal>
                    </React.Fragment>
                )
            }}
        />), [activeProcessorId, processorConditionalsNode.current, conditionalsNode]);
};


domReady(function () {
    let form = CF_ADMIN.form;
    if (!form.hasOwnProperty('fields')) {
        form.fields = {};
    }

    let initialConditionals = [];
    const conditionalsNode = document.getElementById('caldera-forms-conditions-panel');
    if (form.hasOwnProperty('conditional_groups') && form.conditional_groups.hasOwnProperty('conditions')) {
        initialConditionals = conditionalsFromCfConfig(form.conditional_groups.conditions, form.fields);
    }

    render(
        <FormBuilder initialConditionals={initialConditionals} form={form} conditionalsNode={conditionalsNode}/>,
        document.getElementById('caldera-forms-form-builder')
    );
});