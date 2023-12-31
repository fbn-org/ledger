import { useEffect, useState } from 'react';

import { Avatar, AvatarGroup, Button, Grid, Icon, IconButton, Stack, Typography, useTheme } from '@mui/material';

import { Edit } from '@mui/icons-material';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import utc from 'dayjs/plugin/utc';

import useLedger from '@/contexts/LedgerContext';

import Card from '../util/Card';

dayjs.extend(advancedFormat);
dayjs.extend(utc);

export default function OccasionCard({
    people,
    occasion,
    ledger,
    editCallback,
    payoutsCallback,
    showPayoutsButton,
    disableStats
}) {
    const theme = useTheme();

    const { getPersonFromId } = useLedger();

    const startDate = dayjs.utc(occasion.start_date).local().format('MMMM Do, YYYY');
    const endDate = dayjs.utc(occasion.end_date).local().format('MMMM Do, YYYY');

    const timeState = occasion.timeState;

    const [transactions, setTransactions] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        setTransactions(ledger.filter((transaction) => transaction.occasion === occasion._id));
    }, [occasion, ledger]);

    useEffect(() => {
        // calculate time until event starts
        if (timeState === 'upcoming') {
            const now = dayjs().utc();
            const start = dayjs.utc(occasion.start_date);
            setTimeLeft(start.diff(now, 'hour'));
        }
    }, [occasion.start_date, timeState]);

    return (
        <Card
            key={occasion._id}
            icon={
                <AvatarGroup
                    spacing="small"
                    onClick={() => {
                        timeState === 'active' && payoutsCallback ? payoutsCallback(occasion) : null;
                    }}
                >
                    {occasion.included_people.map((personId) => {
                        const person = getPersonFromId(personId);
                        return (
                            <Avatar
                                key={personId}
                                sx={{
                                    bgcolor: `${person._id.toLowerCase()}.main`,
                                    height: 20,
                                    width: 20,
                                    fontSize: 12
                                }}
                            >
                                <Icon />
                            </Avatar>
                        );
                    })}
                </AvatarGroup>
            }
            title={occasion.name}
            subtitle={`${startDate} - ${endDate}`}
            // subtitleIcon={
            //     subtitleIcons[timeState]
            // }
            //titleChip={<Chip label="Active" color="primary" variant="outlined" size="small" />}
            actions={
                editCallback ? (
                    <IconButton
                        color="primary"
                        onClick={() => {
                            editCallback(occasion);
                        }}
                    >
                        <Edit />
                    </IconButton>
                ) : null
            }
            style={{ width: '100%' }}
        >
            <Stack
                direction="column"
                width="100%"
                gap={2}
            >
                {!disableStats ? (
                    <Grid
                        container
                        spacing={2}
                    >
                        <Grid
                            item
                            xs={6}
                        >
                            <Stack
                                direction="column"
                                alignItems="flex-start"
                            >
                                <Typography variant="h6">{transactions.length}</Typography>
                                <Typography variant="body2">transactions</Typography>
                            </Stack>
                        </Grid>

                        <Grid
                            item
                            xs={6}
                        >
                            <Stack
                                direction="column"
                                alignItems="flex-start"
                            >
                                <Typography variant="h6">
                                    $
                                    {transactions
                                        .reduce((total, transaction) => total + parseFloat(transaction.total), 0)
                                        .toFixed(2)}
                                </Typography>
                                <Typography variant="body2">total spend</Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                ) : (
                    <Stack
                        direction="column"
                        width="100%"
                        alignItems="flex-start"
                    >
                        <Typography variant="h6">{timeLeft > 0 ? `${timeLeft} hours` : '< 1 hour'}</Typography>
                        <Typography variant="body2">until start</Typography>
                    </Stack>
                )}

                {showPayoutsButton ? (
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                            payoutsCallback(occasion);
                        }}
                        sx={{ borderRadius: '5px', width: '100%', height: 'auto' }}
                    >
                        Payouts
                    </Button>
                ) : null}
            </Stack>
        </Card>
    );
}
