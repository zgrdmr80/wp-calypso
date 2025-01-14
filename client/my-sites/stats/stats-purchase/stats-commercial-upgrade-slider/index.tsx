import formatNumber from '@automattic/components/src/number-formatters/lib/format-number';
import formatCurrency from '@automattic/format-currency';
import { useTranslate } from 'i18n-calypso';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import TierUpgradeSlider from 'calypso/my-sites/stats/stats-purchase/tier-upgrade-slider';
import { useSelector } from 'calypso/state';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import { StatsPlanTierUI } from '../types';
import useAvailableUpgradeTiers from '../use-available-upgrade-tiers';
import './styles.scss';

// Special case for per-unit fees over the max tier.
// In millions.
const EXTENSION_THRESHOLD = 2;

function useTranslatedStrings() {
	const translate = useTranslate();
	const limits = translate( 'Monthly site views limit', {
		comment: 'Heading for Stats Upgrade slider. The monthly views limit.',
	} ) as string;
	const price = translate( 'You will pay', {
		comment: 'Heading for Stats Upgrade slider. The monthly price.',
	} ) as string;
	const strategy = translate( 'Price per month, billed yearly', {
		comment: 'Stats Upgrade slider message. The billing strategy.',
	} ) as string;

	return {
		limits,
		price,
		strategy,
	};
}

function getStepsForTiers( tiers: StatsPlanTierUI[] ) {
	// TODO: Review tier values from API.
	// Should consider validating the inputs before displaying them.
	return tiers.map( ( tier ) => {
		// No transformation needed (yet).
		let price = '';
		if ( typeof tier.price === 'string' ) {
			price = tier.price;
		}

		// View should be a number but the current mock data
		// includes a string for the final tier.
		// Special case that scenario for now.
		let views = '';
		if ( tier.views === null ) {
			views = `${ formatNumber( EXTENSION_THRESHOLD * 1000000 ) }+`;
		} else {
			views = formatNumber( tier.views );
		}

		// Return the new step with string values.
		return {
			lhValue: views,
			rhValue: price,
			tierViews: tier.views === null ? EXTENSION_THRESHOLD * 1000000 : tier.views,
		};
	} );
}

type StatsCommercialUpgradeSliderProps = {
	currencyCode: string;
	analyticsEventName?: string;
	onSliderChange: ( quantity: number ) => void;
};

const getTierQuentity = ( tiers: StatsPlanTierUI, isTierUpgradeSliderEnabled: boolean ) => {
	if ( isTierUpgradeSliderEnabled ) {
		if ( tiers?.views === null && tiers?.transform_quantity_divide_by ) {
			// handle extension an tier by muliplying the limit of the highest tier
			return EXTENSION_THRESHOLD * tiers.transform_quantity_divide_by; // TODO: this will use a dynamic multiplier (#85246)
		}
		return tiers?.views;
	}
	return 0;
};

function StatsCommercialUpgradeSlider( {
	currencyCode,
	analyticsEventName,
	onSliderChange,
}: StatsCommercialUpgradeSliderProps ) {
	// Responsible for:
	// 1. Fetching the tiers from the API.
	// 2. Transforming the tiers into a format that the slider can use.
	// 3. Preparing the UI strings for the slider.
	// 4. Rendering the slider.
	// 5. Nofiying the parent component when the slider changes.

	const translate = useTranslate();
	const siteId = useSelector( ( state ) => getSelectedSiteId( state ) );
	const tiers = useAvailableUpgradeTiers( siteId );
	const uiStrings = useTranslatedStrings();

	// Special case for per-unit fees.
	// Determine this based on last tier in the list.
	// The translate() call returns a node so we need to set the type correctly.
	let perUnitFeeMessaging;
	const lastTier = tiers.at( -1 );
	const hasPerUnitFee = !! lastTier?.per_unit_fee;
	if ( hasPerUnitFee ) {
		const perUnitFee = Number( lastTier?.per_unit_fee );

		perUnitFeeMessaging = translate(
			'This is the base price for %(views_extension_limit)s million monthly views; beyond that, you will be charged additional +%(extension_value)s per million views.',
			{
				args: {
					views_extension_limit: EXTENSION_THRESHOLD,
					extension_value: formatCurrency( perUnitFee, currencyCode, {
						isSmallestUnit: true,
						stripZeros: true,
					} ),
				},
			}
		) as string;
	}

	// Transform the tiers into a format that the slider can use.
	const steps = getStepsForTiers( tiers );

	const handleSliderChanged = ( index: number ) => {
		const quantity = getTierQuentity( tiers[ index ], true );

		if ( analyticsEventName ) {
			recordTracksEvent( analyticsEventName, {
				tier_views: quantity,
				default_changed: index !== 0, // 0 is the default initialVlaue value for <TierUpgradeSlider />
			} );
		}

		onSliderChange( quantity as number );
	};

	return (
		<TierUpgradeSlider
			className="stats-commercial-upgrade-slider"
			uiStrings={ uiStrings }
			popupInfoString={ perUnitFeeMessaging }
			steps={ steps }
			onSliderChange={ handleSliderChanged }
			marks={ true }
		/>
	);
}

export { StatsCommercialUpgradeSlider as default, StatsCommercialUpgradeSlider, getTierQuentity };
